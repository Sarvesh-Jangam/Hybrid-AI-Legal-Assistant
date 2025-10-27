# import os
# import streamlit as st
# import tempfile
# from utils.query_agent import QueryAgent
# from langchain_community.document_loaders import PyPDFLoader
# from langchain.text_splitter import CharacterTextSplitter
# from langchain_community.vectorstores import FAISS
# from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
# from langchain.chains import RetrievalQA

# # Load Gemini API Key securely
# API_KEY = st.secrets.get("GEMINI_API_KEY")
# if not API_KEY:
#     st.error("❌ GEMINI_API_KEY not found in secrets.toml")
#     st.stop()

# # Streamlit UI setup
# st.set_page_config(page_title="Legal Chatbot", layout="wide")
# st.title("⚖️ Legal AI Chatbot")
# st.write("Ask legal questions related to **Indian Litigation & Corporate Laws**.")

# # Predefined PDFs
# pdf_paths = {
#     #"IPC": "data/penal_code.pdf",
#      "legaldoc": "data/legaldoc.pdf",

# }

# # Sidebar: Ask from existing or upload PDF
# option = st.sidebar.radio(
#     "Choose PDF source",
#     ("Ask from our existing Legal Database", "Ask from your own PDF")
# )

# # ---------- Option 1: Ask from Existing PDFs ----------
# if option == "Ask from our existing Legal Database":
#     class LegalChatbot:
#         def __init__(self, pdf_paths):
#             self.query_agents = {
#                 name: QueryAgent(path, name, API_KEY)
#                 for name, path in pdf_paths.items()
#             }

#         def answer_query(self, query):
#             best_answer = None
#             best_score = 0
#             best_source = None

#             for name, agent in self.query_agents.items():
#                 retrieved_text = agent.get_relevant_text(query)

#                 if retrieved_text:
#                     score = len(retrieved_text)
#                     if score > best_score:
#                         best_score = score
#                         best_source = name

#                         # Use Gemini LLM on retrieved text
#                         full_prompt = f"""
# You are a legal assistant. Use the following legal text to answer the user's question.

# ---DOCUMENT---
# {retrieved_text}
# ---------------

# Question: {query}

# Provide a helpful, law-abiding, and clear answer based on the context.
# """
#                         llm = ChatGoogleGenerativeAI(
#                             model="models/gemini-2.5-pro",
#                             temperature=0.3,
#                             google_api_key=API_KEY
#                         )
#                         response = llm.invoke(full_prompt)
#                         best_answer = response.content if hasattr(response, 'content') else str(response)

#             if best_answer:
#                 return f"""📖 **Source:** {best_source}\n\n💡 **Answer:**\n\n{best_answer}"""
#             else:
#                 return "❌ No relevant legal information found."

#     bot = LegalChatbot(pdf_paths)
#     query = st.text_input("📝 Enter your legal question:")

#     if st.button("Ask"):
#         if query:
#             with st.spinner("🔍 Searching..."):
#                 response = bot.answer_query(query)
#                 st.markdown(response)
#         else:
#             st.warning("⚠️ Please enter a question!")

# # ---------- Option 2: Upload your own PDF ----------
# else:
#     uploaded_pdf = st.file_uploader("📤 Upload your legal PDF", type="pdf")
#     query = st.text_input("📝 Enter your legal question:")

#     if uploaded_pdf and query:
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
#             tmp_file.write(uploaded_pdf.read())
#             tmp_path = tmp_file.name

#         loader = PyPDFLoader(tmp_path)
#         docs = loader.load()
#         splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
#         chunks = splitter.split_documents(docs)

#         embeddings = GoogleGenerativeAIEmbeddings(
#             model="models/embedding-001",
#             google_api_key=API_KEY
#         )

#         vectorstore = FAISS.from_documents(chunks, embeddings)

#         def qa_from_vectorstore(vs, query):
#             llm = ChatGoogleGenerativeAI(
#                 model="models/gemini-2.5-pro",
#                 temperature=0.3,
#                 google_api_key=API_KEY
#             )
#             qa_chain = RetrievalQA.from_chain_type(
#                 llm=llm,
#                 retriever=vs.as_retriever()
#             )
#             return qa_chain.run(query)

#         with st.spinner("🔍 Searching in your PDF..."):
#             response = qa_from_vectorstore(vectorstore, query)
#             st.markdown(f"💡 **Answer:**\n\n{response}")

#     elif not uploaded_pdf and query:
#         st.warning("⚠️ Please upload a PDF.")
