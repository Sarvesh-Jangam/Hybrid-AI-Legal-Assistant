# AI Legal Assistant - Setup & Startup Guide

## Prerequisites ✅
- Python 3.12.6 (installed)
- Node.js v20.17.0 (installed)
- All dependencies installed

## Important: Add Your Gemini API Key

**Before starting the servers, you MUST add your Gemini API key:**

1. Open `ai-model\.env` file
2. Replace the empty quotes with your actual API key:
   ```
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```

## Starting the Servers

### Backend (FastAPI) - Terminal 1
```bash
cd ai-model
uvicorn main:app --reload --port 8000
```
- Backend will run on: http://localhost:8000
- API docs available at: http://localhost:8000/docs

### Frontend (Next.js) - Terminal 2
```bash
npm run dev
```
- Frontend will run on: http://localhost:3000

## Available API Endpoints

1. **`/ask-existing`** - Query preloaded legal documents
2. **`/ask-upload`** - Upload PDF and ask questions
3. **`/ask-context`** - Continue questioning uploaded documents

## Features Integrated

✅ Query Mode Selection (Legal Database / Upload PDF / Continue with Uploaded)
✅ File upload handling
✅ AI model integration with all routes
✅ Error handling and loading states
✅ Responsive UI with modern design

## Troubleshooting

- **API Key Error**: Make sure your Gemini API key is properly set in `.env`
- **Port Conflicts**: Backend uses 8000, frontend uses 3000
- **CORS Issues**: Already configured to allow all origins
- **Dependencies**: All required packages are installed

## Project Structure

```
ai-legal-assistant/
├── ai-model/           # FastAPI backend
│   ├── main.py        # Main FastAPI application
│   ├── .env           # Environment variables (ADD YOUR API KEY HERE)
│   ├── requirements.txt
│   └── data/          # Legal documents
├── src/app/           # Next.js frontend
│   ├── page.js        # Main UI (updated with AI integration)
│   └── api/           # API routes that proxy to FastAPI
└── package.json       # Frontend dependencies
```

Ready to go! 🚀
