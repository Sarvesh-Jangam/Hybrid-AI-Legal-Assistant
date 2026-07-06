import os
import tempfile
import hashlib
import re
from typing import Dict
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langchain.text_splitter import RecursiveCharacterTextSplitter, CharacterTextSplitter
# from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
# from langchain.vectorstores.base import VectorStore
# from langchain_core.vectorstores import VectorStore
# from langchain_community.vectorstores.utils import distance
# from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from utils.clause_extractor import ClauseExtractor
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.document_loaders import PyPDFLoader, UnstructuredPDFLoader
from pdf2image import convert_from_path
import pytesseract
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.models import VectorParams, Distance
from langchain.prompts import PromptTemplate


# Load environment variables
load_dotenv()

# Configure Poppler path from .env (so it works in venv or server)
POPPLER_PATH = os.getenv("POPPLER_PATH")

vectorstore_cache: Dict[str, QdrantVectorStore] = {}


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
VECTOR_SIZE = 384

# # Path to save vectorstores
# VECTORSTORE_DIR = "hf_vectorstores"
# os.makedirs(VECTORSTORE_DIR, exist_ok=True)

QDRANT_URL = os.getenv("QDRANT_URL")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")

qdrant_client = QdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
)
print(qdrant_client.get_collections())

# -------------------------------
# Caches
# -------------------------------
# vectorstore_cache: Dict[str, VectorStore] = {}
# legal_docs_store: Dict[str, VectorStore] = {}  # For /ask-existing
legal_docs_store: Dict[str, QdrantVectorStore] = {}


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



# # -------------------------------
# # Utility: Create FAISS vectorstore safely
# # -------------------------------
# def create_faiss_vectorstore_safe(chunks, embeddings, name: str = None):
#     try:
#         vs = FAISS.from_documents(chunks, embeddings)
#         if name:
#             save_path = os.path.join(VECTORSTORE_DIR, name)
#             vs.save_local(save_path)
#         return vs
#     except Exception as e:
#         print(f"⚠️ Failed to embed documents: {e}")
#         return None

# def create_qdrant_vectorstore(chunks, embeddings, collection_name: str):
#     try:
#         vectorstore = QdrantVectorStore.from_documents(
#             documents=chunks,
#             embedding=embeddings,
#             api_key=QDRANT_API_KEY,
#             url=QDRANT_URL,
#             collection_name=collection_name
#         )
#         return vectorstore
#     except Exception as e:
#         print(f"⚠️ Failed to create Qdrant vectorstore: {e}")
#         return None

UPLOAD_COLLECTION = "uploaded_docs"

def create_qdrant_vectorstore(chunks, embeddings):

    existing = [
        c.name for c in qdrant_client.get_collections().collections
    ]

    if UPLOAD_COLLECTION not in existing:

        print(f"Creating collection: {UPLOAD_COLLECTION}")

        qdrant_client.create_collection(
            collection_name=UPLOAD_COLLECTION,
            vectors_config=VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE,
            ),
        )

    vectorstore = QdrantVectorStore(
        client=qdrant_client,
        collection_name=UPLOAD_COLLECTION,
        embedding=embeddings,
    )

    print(f"Inserting documents into uploaded docs.")

    vectorstore.add_documents(chunks)

    return vectorstore

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


@app.on_event("startup")
async def preload_legal_documents():

    predefined_pdfs = {
        "Guide to Litigation in India": "data/Guide-to-Litigation-in-India.pdf",
        "Legal Compliance & Corporate Laws": "data/Legal-Compliance-Corporate-Laws.pdf",
        "legaldoc": "data/legaldoc.pdf",
        "Constitution of India": "data/constitution_of_india.pdf",
        "IPC": "data/penal_code.pdf",
        "Format": "data/format.pdf"
    }

    existing = [
        c.name for c in qdrant_client.get_collections().collections
    ]

    print("Existing collections:", existing)

    for name, path in predefined_pdfs.items():

        if name in existing:

            print(f"Loading existing collection: {name}")

            vectorstore = QdrantVectorStore(
                client=qdrant_client,
                collection_name=name,
                embedding=embeddings,
            )

        else:

            print(f"Creating new collection: {name}")

            loader = PyPDFLoader(path)

            docs = loader.load()

            chunks = smart_chunk_splitter(docs)

            for chunk in chunks:
                chunk.metadata["source"] = name

            vectorstore = create_qdrant_vectorstore(
                chunks,
                embeddings,
                name
            )

        legal_docs_store[name] = vectorstore

        info = qdrant_client.get_collection(name)

        print(f"✔️ {name} is successfully loaded from collections.")
        print(f"{name} points:", info.points_count)


@app.post("/defend-case")
async def defend_case(file: UploadFile = None, case_description: str = Form(None),user_intent: str = Form(None)):
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
        user_focus_section = ""

        if user_intent and user_intent.strip():
            user_focus_section = f"""
        ### User's Specific Request
        The user has specifically requested the following focus:

        "{user_intent.strip()}"

        You MUST prioritize addressing this request in your analysis.
        If the request is narrow (e.g., bail, Section 307 IPC, procedural lapses),
        focus primarily on that instead of giving a broad generic strategy.
        """
        
        prompt = f"""
        You are an expert Indian defense lawyer and legal strategist.
        {user_focus_section}
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
            convert_system_message_to_human=True,
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
    try:
        all_docs = []
        for name, vectorstore in legal_docs_store.items():
            if vectorstore is None:
                print(f"Skipping null collection: {name}")
                continue
            retriever = vectorstore.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 5}
            )

            docs = retriever.invoke(query)
            for doc in docs:
                doc.metadata["source"] = name
                all_docs.append(doc)

        if not all_docs:
            return {"error": "No relevant information found."}

        # STEP 3: Combine best matches
        combined_text = "\n\n".join(
            doc.page_content for doc in all_docs
        )

        best_source = all_docs[0].metadata.get("source", "Unknown")


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
        convert_system_message_to_human=True,
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
    
    except Exception as e:
        print("ask-existing error:", e)
        return {"error": str(e)}

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


# @app.post("/ask-upload")
# async def ask_from_uploaded(query: str = Form(...), file: UploadFile = None):
#     if file is None:
#         return {"error": "No file uploaded."}
#     file_bytes = await file.read()
#     file_id = file_hash(file_bytes)
#     # Step 1: Check cache
#     if file_id in vectorstore_cache:
#         vectorstore = vectorstore_cache[file_id]
#     else:
#         try:
#             # Step 2: Try loading existing Qdrant collection
#             vectorstore = QdrantVectorStore(
#                 client=qdrant_client,
#                 collection_name=file_id,
#                 embedding=embeddings
#             )
#             vectorstore.similarity_search("test", k=1)
#             vectorstore_cache[file_id] = vectorstore
#             print(f"✅ Loaded existing collection: {file_id}")
#         except Exception:
#             print(f"⚡ Creating new collection: {file_id}")
#             # Step 3: Process PDF
#             with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
#                 tmp_file.write(file_bytes)
#                 tmp_file_path = tmp_file.name
#             docs = []
#             try:
#                 loader = PyPDFLoader(tmp_file_path)
#                 docs = loader.load()
#             except Exception as e:
#                 print(f"⚠️ PyPDFLoader failed: {e}")
#             if not docs:
#                 loader = UnstructuredPDFLoader(tmp_file_path)
#                 docs = loader.load()
#             if not docs:
#                 ocr_text = extract_text_with_ocr(tmp_file_path)
#                 docs = [Document(page_content=ocr_text)]

#             chunks = smart_chunk_splitter(docs)

#             vectorstore = create_qdrant_vectorstore(
#                 chunks,
#                 embeddings,
#                 file_id
#             )
#             vectorstore_cache[file_id] = vectorstore
#             os.unlink(tmp_file_path)

#     # Step 4: QA Chain

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

#     qa_chain = RetrievalQA.from_chain_type(
#         llm=llm,
#         retriever=vectorstore.as_retriever(
#             search_type="similarity",
#             search_kwargs={"k": 5}
#         )
#     )

#     result = qa_chain.run(query)
#     cleaned_result = clean_ai_response(result)
#     return {
#         "answer": cleaned_result,
#         "file_id": file_id
#     }

@app.post("/ask-upload")
async def ask_from_uploaded(query: str = Form(...), file: UploadFile = None):

    if file is None:
        return {"error": "No file uploaded."}

    file_bytes = await file.read()
    file_id = file_hash(file_bytes)
    print("File ID:", file_id)

    # -------------------------
    # Save temp file
    # -------------------------
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_file.write(file_bytes)
        tmp_file_path = tmp_file.name

    docs = []

    # -------------------------
    # STEP 1: Extract PDF content
    # -------------------------
    try:
        loader = PyPDFLoader(tmp_file_path)
        docs = loader.load()
        print("Loaded via PyPDFLoader:", len(docs))
    except Exception as e:
        print("PyPDFLoader failed:", e)

    if not docs:
        try:
            loader = UnstructuredPDFLoader(tmp_file_path)
            docs = loader.load()
            print("Loaded via UnstructuredPDFLoader:", len(docs))
        except Exception as e:
            print("UnstructuredPDFLoader failed:", e)

    if not docs:
        text = extract_text_with_ocr(tmp_file_path)
        docs = [Document(page_content=text)]
        print("Loaded via OCR")

    if not docs or not docs[0].page_content.strip():
        os.unlink(tmp_file_path)
        return {"error": "Failed to extract readable text from PDF."}

    full_text = "\n".join([d.page_content for d in docs])
    excerpt = full_text[:3000]

    # -------------------------
    # STEP 2: LLM Legal Classification
    # -------------------------
    llm_classifier = ChatGoogleGenerativeAI(
        model="models/gemini-2.5-flash",
        google_api_key=GEMINI_API_KEY,
        temperature=0.0,
        max_output_tokens=50,
    )

    classification_prompt = f"""
You are a strict legal document classifier.

Determine whether the following document is a LEGAL document.

Legal documents include:
- Contracts
- Agreements
- Court orders
- FIRs
- Case files
- Statutes
- Legal notices
- Arbitration documents
- Government Acts

Respond ONLY with:
YES  -> if it is legal
NO   -> if it is not legal

Document excerpt:
----------------
{excerpt}
----------------
Answer:
"""

    classification_response = llm_classifier.invoke(classification_prompt)
    classification_text = classification_response.content.strip().lower()

    print("Classification Result:", classification_text)

    if "yes" not in classification_text:
        os.unlink(tmp_file_path)
        return {
            "error": "Uploaded document does not appear to be a legal document. Only legal documents are allowed."
        }

    # -------------------------
    # STEP 3: Vectorstore Handling
    # -------------------------
    if file_id in vectorstore_cache:
        vectorstore = vectorstore_cache[file_id]
        print("✅ Using cached vectorstore")

    else:
        if qdrant_client.collection_exists(file_id):
            print("✅ Loading existing collection from Qdrant")

            vectorstore = QdrantVectorStore(
                client=qdrant_client,
                collection_name=file_id,
                embedding=embeddings
            )
        else:
            print("⚡ Creating new Qdrant collection")

            chunks = smart_chunk_splitter(docs)

            for chunk in chunks:
                chunk.metadata["file_id"] = file_id

            vectorstore = create_qdrant_vectorstore(
                chunks,
                embeddings,
            )

        vectorstore_cache[file_id] = vectorstore

    os.unlink(tmp_file_path)

    # -------------------------
    # STEP 4: Lawyer-Conditioned RAG
    # -------------------------

    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5}
    )

    llm = ChatGoogleGenerativeAI(
        model="models/gemini-2.5-flash",
        google_api_key=GEMINI_API_KEY,
        temperature=0.2,
        max_output_tokens=2048
    )

    legal_prompt_template = """
You are a highly experienced Indian legal practitioner.

You must answer strictly based on the provided document context.

Rules:
- Respond as a lawyer advising a client.
- Maintain professional legal tone.
- Reference clauses/sections where applicable.
- Do NOT fabricate information.
- If insufficient information exists, explicitly state:
  "The document does not provide sufficient information to answer this question."
- Provide structured reasoning.

Structure your response exactly as:

### Legal Analysis
(Explain relevant provisions from document)

### Legal Implications
(Explain risks, liabilities, exposure)

### Recommended Action
(Practical legal steps client should consider)

Context:
----------------
{context}
----------------

User Question:
{question}

Provide your legal opinion below:
"""

    LEGAL_PROMPT = PromptTemplate(
        template=legal_prompt_template,
        input_variables=["context", "question"]
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
        chain_type_kwargs={"prompt": LEGAL_PROMPT},
        return_source_documents=False
    )

    result = qa_chain({"query": query})
    answer = result["result"]

    return {
        "answer": clean_ai_response(answer),
        "file_id": file_id
    }


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
    convert_system_message_to_human=True,
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
        try:
            vectorstore = QdrantVectorStore(
                client=qdrant_client,
                collection_name=file_id,
                embedding=embeddings
            )

            vectorstore.similarity_search("test", k=1)

            vectorstore_cache[file_id] = vectorstore

        except Exception:
            return {"error": "Context not found. Please upload file first."}

    vectorstore = vectorstore_cache[file_id]

    llm = ChatGoogleGenerativeAI(
    model="models/gemini-2.5-flash",
    google_api_key=GEMINI_API_KEY,
    convert_system_message_to_human=True,
    model_kwargs={
        "temperature": 0.2, # Lower temperature for more consistent formatting
        "top_p": 0.8,
        "top_k": 40,
        "max_output_tokens": 2048,
    }
)

    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={
            "k": 5,
            "filter": {
                "must": [
                    {
                        "key": "file_id",
                        "match": {"value": file_id}
                    }
                ]
            }
        }
    ))
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