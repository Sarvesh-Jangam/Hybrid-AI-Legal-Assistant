import os
import tempfile
import hashlib
import re
from typing import Dict
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter, CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.vectorstores.base import VectorStore
# from langchain_community.vectorstores.utils import distance
# from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from utils.clause_extractor import ClauseExtractor
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader, UnstructuredPDFLoader
from pdf2image import convert_from_path
import pytesseract

# Load environment variables
load_dotenv()

# Configure Poppler path from .env (so it works in venv or server)
POPPLER_PATH = os.getenv("POPPLER_PATH")

# Ensure Poppler path is in system PATH (so pdf2image / pytesseract can find it)
if POPPLER_PATH and os.path.isdir(POPPLER_PATH):
    os.environ["PATH"] += os.pathsep + POPPLER_PATH
    print(f"✅ Poppler path added to PATH: {POPPLER_PATH}")
else:
    print("⚠️ POPPLER_PATH not found or invalid. OCR may fail for scanned PDFs.")

TESSERACT_PATH = os.getenv("TESSERACT_PATH")

if TESSERACT_PATH:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH

GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

app = FastAPI()


# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# Path to save vectorstores
VECTORSTORE_DIR = "hf_vectorstores"
os.makedirs(VECTORSTORE_DIR, exist_ok=True)

# -------------------------------
# Caches
# -------------------------------
vectorstore_cache: Dict[str, VectorStore] = {}
legal_docs_store: Dict[str, VectorStore] = {}  # For /ask-existing


# -------------------------------
# Utility: File hash
# -------------------------------
def file_hash(file_bytes):
    return hashlib.md5(file_bytes).hexdigest()

# -------------------------------
# Utility: Clean AI response
# -------------------------------
def clean_ai_response(response: str) -> str:
    """Clean and normalize AI response for Markdown rendering in ReactMarkdown."""
    cleaned = response.strip()

    # 1️⃣ Collapse excessive blank lines
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)

    # 2️⃣ Remove trailing spaces
    cleaned = re.sub(r'[ \t]+$', '', cleaned, flags=re.MULTILINE)

    # 3️⃣ Ensure numbered items like "5. ### ..." appear on their own lines
    cleaned = re.sub(r'(\d+)\.\s*###\s*', r'\n\n\1. ### ', cleaned)

    # 4️⃣ Ensure every "### Heading" starts on a new line
    cleaned = re.sub(r'(?<!\n)\s*(### )', r'\n\n\1', cleaned)

    # 5️⃣ Normalize bullets (replace * or + or • with "-")
    cleaned = re.sub(r'^[*+•]\s+', '- ', cleaned, flags=re.MULTILINE)

    # 6️⃣ Ensure numbered lists are clean and spaced correctly (e.g., "1.Item" → "1. Item")
    cleaned = re.sub(r'(\d+)\.(?=[^\s])', r'\1. ', cleaned)

    # 7️⃣ Remove Markdown heading duplicates (e.g., repeated "### ###")
    cleaned = re.sub(r'(###\s+){2,}', r'### ', cleaned)

    return cleaned



# -------------------------------
# Utility: Create FAISS vectorstore safely
# -------------------------------
def create_faiss_vectorstore_safe(chunks, embeddings, name: str = None):
    try:
        vs = FAISS.from_documents(chunks, embeddings)
        if name:
            save_path = os.path.join(VECTORSTORE_DIR, name)
            vs.save_local(save_path)
        return vs
    except Exception as e:
        print(f"⚠️ Failed to embed documents: {e}")
        return None


# smart chunk splitting
def smart_chunk_splitter(docs):
    final_chunks = []

    for doc in docs:
        length = len(doc.page_content)

        # Dynamically decide chunk size and overlap
        if length < 1000:
            chunk_size = 400
            chunk_overlap = 50
        elif length < 3000:
            chunk_size = 700
            chunk_overlap = 100
        else:
            chunk_size = 1000
            chunk_overlap = 120

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ".", " ", ""]
        )

        # Always split each document individually
        chunks = splitter.split_documents([doc])
        final_chunks.extend(chunks)

    return final_chunks



# -------------------------------
# Startup: Preload legal docs
# -------------------------------
# @app.on_event("startup")
# async def preload_legal_documents():
#     print("🔍 Preloading legal documents...")
#     # embeddings = GoogleGenerativeAIEmbeddings(
#     #     model="models/embedding-001",
#     #     google_api_key=GEMINI_API_KEY
#     # )

#     predefined_pdfs = {
#         "Guide to Litigation in India": "data/Guide-to-Litigation-in-India.pdf",
#         "Legal Compliance & Corporate Laws": "data/Legal-Compliance-Corporate-Laws.pdf",
#         "legaldoc": "data/legaldoc.pdf",
#         "Constitution of India": "data/constitution_of_india.pdf",
#         "IPC": "data/penal_code.pdf",
#         "Format": "data/format.pdf"
#     }

#     for name, path in predefined_pdfs.items():
#         save_path = os.path.join(VECTORSTORE_DIR, name)

#         if os.path.exists(save_path):
#             print(f"✅ Loading cached vectorstore for: {name}")
#             vectorstore = FAISS.load_local(save_path, embeddings, allow_dangerous_deserialization=True)
#         else:
#             loader = PyPDFLoader(path)
#             docs = loader.load()
#             chunks = smart_chunk_splitter(docs)

#             for chunk in chunks:
#                 chunk.metadata["source"] = name

#             vectorstore = create_faiss_vectorstore_safe(chunks, embeddings, name)

#         if vectorstore:
#             legal_docs_store[name] = vectorstore

#     print("✅ Legal documents preloaded.")

@app.on_event("startup")
async def preload_legal_documents():
    print("🔍 Preloading legal documents with HuggingFace embeddings...")

    predefined_pdfs = {
        "Guide to Litigation in India": "data/Guide-to-Litigation-in-India.pdf",
        "Legal Compliance & Corporate Laws": "data/Legal-Compliance-Corporate-Laws.pdf",
        "legaldoc": "data/legaldoc.pdf",
        "Constitution of India": "data/constitution_of_india.pdf",
        "IPC": "data/penal_code.pdf",
        "Format": "data/format.pdf"
    }

    for name, path in predefined_pdfs.items():
        save_path = os.path.join(VECTORSTORE_DIR, name)

        if os.path.exists(save_path):
            print(f"✅ Loading cached HuggingFace vectorstore for: {name}")
            vectorstore = FAISS.load_local(save_path, embeddings, allow_dangerous_deserialization=True)
        else:
            loader = PyPDFLoader(path)
            docs = loader.load()
            chunks = smart_chunk_splitter(docs)

            for chunk in chunks:
                chunk.metadata["source"] = name

            vectorstore = create_faiss_vectorstore_safe(chunks, embeddings, name)

        if vectorstore:
            legal_docs_store[name] = vectorstore

    print("✅ HuggingFace legal documents preloaded.")

# -------------------------------
# /defend-case: Suggest defense strategy based on case document or text
# -------------------------------
# @app.post("/defend-case")
# async def defend_case(file: UploadFile = None, case_description: str = Form(None)):
    """
    Analyze the uploaded legal case or provided description
    and suggest possible defense strategies in Markdown format.
    """
    try:
        case_text = ""

        # If file provided → extract text
        if file:
            file_bytes = await file.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                tmp_file.write(file_bytes)
                tmp_file_path = tmp_file.name

            try:
                loader = PyPDFLoader(tmp_file_path)
                docs = loader.load()
                case_text = "\n".join([d.page_content for d in docs])
            except Exception as e:
                print(f"⚠️ PyPDFLoader failed: {e}")
                # Try OCR as fallback
                print("🧠 Performing OCR for case PDF...")
                case_text = extract_text_with_ocr(tmp_file_path)

            os.unlink(tmp_file_path)

        elif case_description:
            case_text = case_description.strip()

        else:
            return {"error": "Please upload a PDF or provide a case description."}

        if not case_text or len(case_text.strip()) < 50:
            return {"error": "Case text is too short or could not be extracted properly."}

        # Prompt for defense analysis
        prompt = f"""
You are an expert Indian defense lawyer and legal strategist.
Analyze the following case details and explain in Markdown how the defendant could prepare their defense.

Rules:
- **Never provide false or speculative information.**
- **Base reasoning on general Indian legal principles.**
- Organize the response in Markdown as:

### Overview of the Case
(Brief understanding of the case)

### Key Legal Issues
- List main legal concerns

### Possible Defense Strategies
- Explain potential defense arguments
- Include relevant sections or precedents if applicable

### Supporting Evidence Needed
- Suggest what kind of evidence or documents can strengthen the defense

### Legal Precautions or Next Steps
- Mention what the defendant or lawyer should do next

---CASE CONTENT---
{case_text[:4000]}  # truncated for token limit
--------------------
Please provide a comprehensive yet concise response, ideally between 400 and 700 words depending on case complexity.

Give your full analysis below:
"""

        llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.3,
            top_p=0.9,
            top_k=40,
            max_output_tokens=3072,
        )


        response = llm.invoke(prompt)
        print(f"🧾 Gemini raw response: {response}")
        answer = (
            response.content
            if hasattr(response, "content")
            else getattr(response, "text", str(response))
        )

        if not answer or not answer.strip():
            print("⚠️ Gemini returned empty response.")
            return {"error": "Model did not return a valid defense strategy."}

        cleaned_answer = clean_ai_response(answer)

        return {"defense_strategy": cleaned_answer}

    except Exception as e:
        return {"error": f"Failed to analyze defense strategy: {str(e)}"}

@app.post("/defend-case")
async def defend_case(file: UploadFile = None, case_description: str = Form(None)):
    """
    Analyze the uploaded legal case or provided description
    and suggest possible defense strategies in Markdown format.
    """
    try:
        case_text = ""

        # ----------------------------
        # 🧾 1. PDF File Input Handling
        # ----------------------------
        if file:
            file_bytes = await file.read()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                tmp_file.write(file_bytes)
                tmp_file_path = tmp_file.name

            docs = []
            try:
                loader = PyPDFLoader(tmp_file_path)
                docs = loader.load()
                print(f"✅ PyPDFLoader extracted {len(docs)} pages.")
            except Exception as e:
                print(f"⚠️ PyPDFLoader failed: {e}")

            # Try UnstructuredPDFLoader if PyPDF fails or extracts no text
            if not docs or len("".join([d.page_content for d in docs]).strip()) == 0:
                print("⚠️ No text from PyPDFLoader — trying UnstructuredPDFLoader...")
                try:
                    from langchain_community.document_loaders import UnstructuredPDFLoader
                    loader = UnstructuredPDFLoader(tmp_file_path)
                    docs = loader.load()
                    print(f"✅ UnstructuredPDFLoader extracted {len(docs)} pages.")
                except Exception as e:
                    print(f"⚠️ UnstructuredPDFLoader failed: {e}")

            # Try OCR if both loaders fail
            if not docs or len("".join([d.page_content for d in docs]).strip()) == 0:
                print("🧠 Performing OCR on scanned PDF...")
                case_text = extract_text_with_ocr(tmp_file_path)
                if not case_text.strip():
                    print("❌ OCR process failed — trying Gemini OCR fallback...")
                    try:
                        from google import genai
                        client = genai.Client(api_key=GEMINI_API_KEY)
                        with open(tmp_file_path, "rb") as f:
                            response = client.models.generate_content(
                                model="gemini-2.0-flash",
                                contents=[
                                    {"mime_type": "application/pdf", "data": f.read()},
                                    {"text": "Extract readable text from this scanned PDF document."}
                                ]
                            )
                        case_text = response.text.strip()
                        print("✅ Gemini OCR extracted text successfully.")
                    except Exception as e:
                        print(f"❌ Gemini OCR fallback failed: {e}")
                        return {"error": "Failed to extract text from PDF (OCR + Gemini fallback failed)."}

            else:
                # If text successfully extracted via loaders
                case_text = "\n".join([d.page_content for d in docs])

            os.unlink(tmp_file_path)

        # ----------------------------
        # 📝 2. Case Description Input
        # ----------------------------
        elif case_description:
            case_text = case_description.strip()

        else:
            return {"error": "Please upload a PDF or provide a case description."}

        # ----------------------------
        # 🚧 3. Validate Extracted Text
        # ----------------------------
        if not case_text or len(case_text.strip()) < 50:
            print("⚠️ Extracted text too short or empty.")
            return {"error": "Case text is too short or could not be extracted properly."}

        # ----------------------------
        # ⚖️ 4. Prepare Legal Defense Prompt
        # ----------------------------
        prompt = f"""
You are an expert Indian defense lawyer and legal strategist.
Analyze the following case details and explain in Markdown how the defendant could prepare their defense.

Rules:
- **Never provide false or speculative information.**
- **Base reasoning on general Indian legal principles.**
- Organize the response in Markdown as:

### Overview of the Case
(Brief understanding of the case in 2 lines maximum)

### Key Legal Issues
- List main legal concerns

### Possible Defense Strategies
- Explain potential defense arguments
- Include relevant sections or precedents if applicable

### Supporting Evidence Needed
- Suggest what kind of evidence or documents can strengthen the defense

### Legal Precautions or Next Steps
- Mention what the defendant or lawyer should do next

Please provide a comprehensive yet concise response, ideally between 400 and 700 words depending on case complexity.
If the response is lengthy, please complete it fully — do not stop mid-sentence or omit sections. Continue until the full defense analysis is complete.

---CASE CONTENT---
{case_text[:4000]}  # truncated for token limit
--------------------

Give your full analysis below:
"""


        # ----------------------------
        # 🤖 5. Invoke Gemini Model
        # ----------------------------
        llm = ChatGoogleGenerativeAI(
            model="models/gemini-2.5-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.3,
            top_p=0.9,
            top_k=40,
            max_output_tokens=8192,
        )

        response = llm.invoke(prompt)
        print("🧾 Gemini response received.")

        answer = (
            response.content
            if hasattr(response, "content")
            else getattr(response, "text", str(response))
        )

        if not answer or not answer.strip():
            print("⚠️ Gemini returned empty response.")
            return {"error": "Model did not return a valid defense strategy."}

        cleaned_answer = clean_ai_response(answer)
        return {"defense_strategy": cleaned_answer}

    except Exception as e:
        print(f"❌ Exception in /defend-case: {e}")
        return {"error": f"Failed to analyze defense strategy: {str(e)}"}


# -------------------------------
# /ask-existing: Ask from preloaded legal docs
# -------------------------------
@app.post("/ask-existing")
async def ask_from_existing(query: str = Form(...)):
    if not legal_docs_store:
        return {"error": "Legal documents not loaded yet."}

    all_matches = []
    for name, vectorstore in legal_docs_store.items():
        results = vectorstore.similarity_search_with_score(query, k=5)
        for doc, score in results:
            if doc and score is not None:
                all_matches.append({
                    "source": doc.metadata.get("source", name),
                    "content": doc.page_content,
                    "score": score
                })

    if not all_matches:
        return {"error": "No relevant information found."}

    from collections import defaultdict
    source_scores = defaultdict(list)
    for match in all_matches:
        source_scores[match["source"]].append(match["score"])

    best_source = min(source_scores, key=lambda s: sum(source_scores[s]) / len(source_scores[s]))
    best_chunks = [m["content"] for m in all_matches if m["source"] == best_source]
    combined_text = "\n\n".join(best_chunks)

    prompt = f"""
You are a professional AI legal research assistant for an online legal platform. 
 Always format answers in **strict Markdown** as follows:

- Use `#`, `##`, or `###` for headings, each on its own line.
- Use `-` (dash) for bullet points, never `•`.
- Do not mix headings and bullets. Example:

### Reason 1: Temporary Provision
- Article 370 was originally meant to be temporary...

### Reason 2: Full Integration
- It prevented many central laws from being applied...

If no clear heading exists, use plain paragraphs.
Never return `•` characters or inline `###` headings.

Your task is to answer user queries using ONLY the excerpts given below from the preloaded legal documents.  

- Always ground your answer in the provided excerpts.  
- If the question is about structure, list the **Chapters, Sections, or Clauses** explicitly present.  
- If you detect cross-references (e.g., "section 376B" from another Act), clarify that it’s a **reference**, not part of this document.  
- If the document does not provide the answer, say: 
  "The provided document excerpts do not contain this information."  

---DOCUMENT EXCERPTS---
{combined_text}
-----------------------

User Question: {query}

Please provide a comprehensive yet concise response, ideally between 400 and 700 words depending on case complexity.

Answer in a clear, structured, legally accurate way:
"""

    llm = ChatGoogleGenerativeAI(
    model="models/gemini-2.5-flash",
    google_api_key=GEMINI_API_KEY,
    model_kwargs={
        "temperature": 0.2,
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 2048,
    }
)

    response = llm.invoke(prompt)
    answer = response.content if hasattr(response, 'content') else str(response)
    cleaned_answer = clean_ai_response(answer)

    return {"answer": cleaned_answer, "source": best_source}


def extract_text_with_ocr(pdf_path):
    """Extract text from scanned PDF using OCR"""
    try:
        images = convert_from_path(pdf_path)
        text = ""
        for img in images:
            text += pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        print(f"❌ OCR process failed: {e}")
        return ""


# -------------------------------
# /ask-upload: Upload PDF & Ask
# -------------------------------
# @app.post("/ask-upload")
# async def ask_from_uploaded(query: str = Form(...), file: UploadFile = None):
#     if file is None:
#         return {"error": "No file uploaded."}

#     file_bytes = await file.read()
#     file_id = file_hash(file_bytes)
#     save_path = os.path.join(VECTORSTORE_DIR, file_id)

#     # embeddings = GoogleGenerativeAIEmbeddings(
#     #     model="models/gemini-embedding-001",
#     #     google_api_key=GEMINI_API_KEY
#     # )

#     if file_id in vectorstore_cache:
#         vectorstore = vectorstore_cache[file_id]
#     elif os.path.exists(save_path):
#         vectorstore = FAISS.load_local(
#             save_path,
#             embeddings,
#             allow_dangerous_deserialization=True
#         )
#         vectorstore_cache[file_id] = vectorstore
#     else:
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
#             tmp_file.write(file_bytes)
#             tmp_file_path = tmp_file.name

#         loader = PyPDFLoader(tmp_file_path)
#         docs = loader.load()
#         chunks = smart_chunk_splitter(docs)
#         vectorstore = create_faiss_vectorstore_safe(chunks, embeddings, name=file_id)

#         if vectorstore:
#             vectorstore_cache[file_id] = vectorstore

#     llm = ChatGoogleGenerativeAI(
#         model="models/gemini-2.5-flash",
#         google_api_key=GEMINI_API_KEY,
#         model_kwargs={
#             "temperature": 0.2,
#             "top_p": 0.8,
#             "top_k": 40,
#             "max_output_tokens": 2048,
#         },
#     )

#     qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vectorstore.as_retriever())
#     result = qa_chain.run(query)
#     cleaned_result = clean_ai_response(result)

#     return {"answer": cleaned_result, "file_id": file_id}

@app.post("/ask-upload")
async def ask_from_uploaded(query: str = Form(...), file: UploadFile = None):
    if file is None:
        return {"error": "No file uploaded."}

    file_bytes = await file.read()
    file_id = file_hash(file_bytes)
    save_path = os.path.join(VECTORSTORE_DIR, file_id)

    if file_id in vectorstore_cache:
        vectorstore = vectorstore_cache[file_id]
    elif os.path.exists(save_path):
        vectorstore = FAISS.load_local(save_path, embeddings, allow_dangerous_deserialization=True)
        vectorstore_cache[file_id] = vectorstore
    else:
        # Save temp PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(file_bytes)
            tmp_file_path = tmp_file.name

        docs = []
        try:
            loader = PyPDFLoader(tmp_file_path)
            docs = loader.load()
        except Exception as e:
            print(f"⚠️ PyPDFLoader failed: {e}")

        # If no text, try UnstructuredPDFLoader
        if not docs or len("".join([d.page_content for d in docs]).strip()) == 0:
            print("⚠️ No text found with PyPDFLoader — trying UnstructuredPDFLoader...")
            try:
                loader = UnstructuredPDFLoader(tmp_file_path)
                docs = loader.load()
            except Exception as e:
                print(f"⚠️ UnstructuredPDFLoader failed: {e}")

        # If still empty, perform OCR
        if not docs or len("".join([d.page_content for d in docs]).strip()) == 0:
            print("🧠 Performing OCR on scanned PDF...")
            ocr_text = extract_text_with_ocr(tmp_file_path)
            if ocr_text:
                docs = [Document(page_content=ocr_text)]
            else:
                print("❌ OCR process failed — trying Gemini OCR fallback...")
                try:
                    from google import genai
                    client = genai.Client(api_key=GEMINI_API_KEY)
                    with open(tmp_file_path, "rb") as f:
                        response = client.models.generate_content(
                            model="gemini-2.0-flash",
                            contents=[
                                {"mime_type": "application/pdf", "data": f.read()},
                                {"text": "Extract readable text from this scanned PDF document."}
                            ]
                        )
                    text = response.text.strip()
                    if text:
                        docs = [Document(page_content=text)]
                    else:
                        return {"error": "Gemini OCR also failed to extract text."}
                except Exception as e:
                    return {"error": f"OCR and Gemini fallback failed: {str(e)}"}

        chunks = smart_chunk_splitter(docs)
        vectorstore = create_faiss_vectorstore_safe(chunks, embeddings, name=file_id)
        if vectorstore:
            vectorstore_cache[file_id] = vectorstore

        os.unlink(tmp_file_path)

    # QA Chain
    llm = ChatGoogleGenerativeAI(
        model="models/gemini-2.5-flash",
        google_api_key=GEMINI_API_KEY,
        model_kwargs={
            "temperature": 0.2,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 2048,
        },
    )

    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vectorstore.as_retriever())
    result = qa_chain.run(query)
    cleaned_result = clean_ai_response(result)

    return {"answer": cleaned_result, "file_id": file_id}



# -------------------------------
# /chat: General chat endpoint
# -------------------------------
@app.post("/chat")
async def general_chat(query: str = Form(...)):
    """General chat endpoint for conversational AI without specific document context"""
    
    prompt = f"""
You are a helpful AI legal assistant. Provide professional, accurate, and helpful legal guidance.
Be conversational but maintain professionalism. If a question requires specific legal documents 
or analysis, suggest the user upload a document or use the legal database.

User Question: {query}

Provide a helpful, informative response:
Please provide a comprehensive yet concise response, ideally between 400 and 700 words depending on case complexity.

"""

    llm = ChatGoogleGenerativeAI(
        model="models/gemini-2.5-pro",
        temperature=0.3,
        google_api_key=GEMINI_API_KEY
    )
    response = llm.invoke(prompt)
    answer = response.content if hasattr(response, 'content') else str(response)
    cleaned_answer = clean_ai_response(answer)

    return {"response": cleaned_answer}

# -------------------------------
# /chat: General chat endpoint
# -------------------------------
@app.post("/chat")
async def general_chat(query: str = Form(...)):
    prompt = f"""
You are an AI-powered legal assistant for an online platform. 
 Always format answers in **strict Markdown** as follows:

- Use `#`, `##`, or `###` for headings, each on its own line.
- Use `-` (dash) for bullet points, never `•`.
- Do not mix headings and bullets. Example:

### Reason 1: Temporary Provision
- Article 370 was originally meant to be temporary...

### Reason 2: Full Integration
- It prevented many central laws from being applied...

If no clear heading exists, use plain paragraphs.
Never return `•` characters or inline `###` headings.

Engage with the user in a professional, respectful, and helpful manner.
- Provide accurate, clear, and concise explanations.  
- Do NOT give speculative or false legal advice.  
- If a query requires reference to legal documents, suggest that the user upload a file or use the preloaded database (/ask-existing).  
- Use simple but professional tone so that even non-lawyers can understand.  

User Question: {query}
Please provide a comprehensive yet concise response, ideally between 400 and 700 words depending on case complexity.

Answer:
"""


    llm = ChatGoogleGenerativeAI(
    model="models/gemini-2.5-flash",
    google_api_key=GEMINI_API_KEY,
    model_kwargs={
        "temperature": 0.2,
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 2048,
    }
)

    response = llm.invoke(prompt)
    answer = response.content if hasattr(response, 'content') else str(response)
    cleaned_answer = clean_ai_response(answer)

    return {"response": cleaned_answer}

# -------------------------------
# /save-chat: Save chat for history
# -------------------------------
@app.post("/save-chat")
async def save_chat(chat_id: str = Form(...), user_message: str = Form(...), ai_response: str = Form(...)):
    """Save a chat conversation for history"""
    # This endpoint will be called by the frontend to save chat messages
    # For now, we'll just return success - the actual saving is handled by the Next.js backend
    return {"success": True, "chat_id": chat_id}

# -------------------------------
# /ask-context: Ask using file_id
# -------------------------------
@app.post("/ask-context")
async def ask_from_context(query: str = Form(...), file_id: str = Form(...)):
    if file_id not in vectorstore_cache:
        save_path = os.path.join(VECTORSTORE_DIR, file_id)
        if os.path.exists(save_path):
            # embeddings = GoogleGenerativeAIEmbeddings(
            #     model="models/embedding-001",
            #     google_api_key=GEMINI_API_KEY
            # )
            vectorstore = FAISS.load_local(save_path, embeddings, allow_dangerous_deserialization=True)
            vectorstore_cache[file_id] = vectorstore
        else:
            return {"error": "Context not found. Please upload the file first."}

    vectorstore = vectorstore_cache[file_id]

    llm = ChatGoogleGenerativeAI(
    model="models/gemini-2.5-flash",
    google_api_key=GEMINI_API_KEY,
    model_kwargs={
        "temperature": 0.2, # Lower temperature for more consistent formatting
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 2048,
    }
)

    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vectorstore.as_retriever())
    result = qa_chain.run(query)
    cleaned_result = clean_ai_response(result)

    return {"answer": cleaned_result, "file_id": file_id}

# -------------------------------
# /extract-clauses: Extract clauses from uploaded PDF
# -------------------------------
@app.post("/extract-clauses")
async def extract_clauses_from_pdf(file: UploadFile = None):
    """Extract clauses from uploaded PDF file"""
    if file is None:
        return {"error": "No file uploaded."}

    try:
        # Save uploaded file temporarily
        file_bytes = await file.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(file_bytes)
            tmp_file_path = tmp_file.name

        # Initialize clause extractor
        extractor = ClauseExtractor(api_key=GEMINI_API_KEY)
        result = extractor.extract_clauses_from_pdf(tmp_file_path)
        
        # Clean up temporary file
        os.unlink(tmp_file_path)
        
        return result
    except Exception as e:
        return {"error": f"Failed to extract clauses: {str(e)}"}

# -------------------------------
# /extract-clauses-from-text: Extract clauses from text
# -------------------------------
@app.post("/extract-clauses-from-text")
async def extract_clauses_from_text(document_text: str = Form(...)):
    """Extract clauses from document text"""
    if not document_text or not document_text.strip():
        return {"error": "No text provided."}

    try:
        # Initialize clause extractor
        extractor = ClauseExtractor(api_key=GEMINI_API_KEY)
        result = extractor.extract_clauses_from_text(document_text)
        
        return result
    except Exception as e:
        return {"error": f"Failed to extract clauses from text: {str(e)}"}

# -------------------------------
# /compare-clauses: Compare clauses between two PDFs
# -------------------------------
@app.post("/compare-clauses")
async def compare_clauses(file1: UploadFile = None, file2: UploadFile = None):
    """Compare clauses between two uploaded PDF files"""
    if not file1 or not file2:
        return {"error": "Two files are required for comparison."}

    try:
        # Initialize clause extractor
        extractor = ClauseExtractor(api_key=GEMINI_API_KEY)
        
        # Process first file
        file1_bytes = await file1.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file1:
            tmp_file1.write(file1_bytes)
            tmp_file1_path = tmp_file1.name
        
        result1 = extractor.extract_clauses_from_pdf(tmp_file1_path)
        os.unlink(tmp_file1_path)
        
        if "error" in result1:
            return result1
        
        # Process second file
        file2_bytes = await file2.read()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file2:
            tmp_file2.write(file2_bytes)
            tmp_file2_path = tmp_file2.name
        
        result2 = extractor.extract_clauses_from_pdf(tmp_file2_path)
        os.unlink(tmp_file2_path)
        
        if "error" in result2:
            return result2
        
        # Compare clauses
        comparison = extractor.compare_clauses(
            result1.get("clauses", []),
            result2.get("clauses", [])
        )
        
        return {
            "document1": {
                "filename": file1.filename,
                "clauses": result1.get("clauses", []),
                "total_clauses": result1.get("total_clauses", 0)
            },
            "document2": {
                "filename": file2.filename,
                "clauses": result2.get("clauses", []),
                "total_clauses": result2.get("total_clauses", 0)
            },
            "comparison": comparison
        }
        
    except Exception as e:
        return {"error": f"Failed to compare clauses: {str(e)}"}
