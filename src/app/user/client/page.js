'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import Navbar from "@/app/components/Navbar";
import { configDotenv } from "dotenv";
import Sidebar from "@/app/components/Sidebar";
import { useChatContext } from "@/app/context/userContextProvider";
import { chatService } from "@/app/services/chatService.js";
import SignaturePad from "@/app/components/SignaturePad.js";
import Modal from "@/app/components/Modal.js";
import MarkdownRenderer from "@/app/components/MarkdownRenderer.js";

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { signOut } = useClerk();
  const user=useUser();


  const { 
    question, setQuestion,
    aiResponse, setAiResponse,
    fileName, setFileName,
    loading, setLoading,
    handleChatSelect,
    handleNewChat,
    chats, setChats
  } = useChatContext();
  
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [queryMode, setQueryMode] = useState('existing'); // 'existing', 'upload', 'context'

  const handleChatSelection = async (chat) => {
    setSelectedChatId(chat._id);
    setQuestion(chat.title || "");
    setFileName(chat.fileName || "");
    
    // Load messages for this chat
    try {
      const res = await fetch(`/api/messages?chatId=${chat._id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  // Handle new chat button click
  const handleNewChatClick = () => {
    setSelectedChatId(null);
    setQuestion("");
    setFileName("");
    setMessages([]);
    setInputMessage("");
    setAiResponse("");
    handleNewChat && handleNewChat();
  };

  //db connection dont touch this
  useEffect(()=>{
    (async()=>await fetch("/api/db",(req,res)=>{
      
    }))();
  },[])

  // Assign role lawyer if signed in
    // useEffect(() => {
    //   (async ()=>{
    //     if (user && isLoaded && !user?.role) {
    //       user?.update(
    //         {
    //         unsafeMetadata: 
    //         {role: "client"}
    //       }
    //     )
    //       // await clerkClient.users.updateUser(userId,{role: "lawyer"});
    //     }
    //   })();
    // }, [user, isLoaded]);

  // Load chats initially and when user signs in
  useEffect(() => {
    const loadUserChats = async () => {
      if (isSignedIn && userId) {
        try {
          const res = await fetch(`/api/chats?userId=${userId}`);
          if (res.ok) {
            const data = await res.json();
            setChats(prevChats => {
              // Only update if the new chats are different
              const newChats = data.chats || [];
              return JSON.stringify(prevChats) !== JSON.stringify(newChats) ? newChats : prevChats;
            });
          } else {
            console.error("Chat API error:", res.status, res.statusText);
          }
        } catch (error) {
          console.error("Error loading chats:", error);
        }
      }
    };
    loadUserChats();
  }, [isSignedIn, userId, setChats]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/login");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleFileChange = async (e) => {
    if (e.target.files?.[0]) {
      setFileName(e.target.files[0].name);
      setUploadedFile(e.target.files[0]);
      setQueryMode('upload');
    }
  };

  // Function to save chat with document
  const saveChatWithDocument = async (question, documentFile, fileId) => {
    try {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('question', question);
      formData.append('fileName', documentFile.name);
      formData.append('fileId', fileId || '');
      formData.append('document', documentFile);

      const response = await fetch('/api/chats/save-with-document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save chat with document');
      }

      console.log('Chat saved with document:', data.documentStored ? 'Document stored successfully' : 'Chat saved without document');
      
      // Refresh chat list
      const chatRes = await fetch(`/api/chats?userId=${userId}`);
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setChats(chatData.chats || []);
      }
      
      return data;
    } catch (error) {
      console.error('Error saving chat with document:', error);
      // Don't throw error to prevent disrupting the main analysis flow
    }
  };

  // Load messages for selected chat
  useEffect(() => {
    const loadMessages = async () => {
      if (selectedChatId) {
        try {
          const res = await fetch(`/api/messages?chatId=${selectedChatId}`);
          if (res.ok) {
            const data = await res.json();
            setMessages(data.messages || []);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      } else {
        setMessages([]);
      }
    };
    loadMessages();
  }, [selectedChatId]);

  // Handle sending messages in chat
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setChatLoading(true);
    
    try {
      // Send message to AI with chat history integration
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: currentMessage,
          contractText: fileName,
          userId: userId,
          chatId: selectedChatId,
          saveToHistory: true,
          fileId: fileId,
          hasUploadedFile: !!uploadedFile
        }),
      });
      
      const data = await response.json();
      
      const aiMessage = {
        content: data.response,
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // If a new chat was created, update the selected chat ID and refresh chat list
      if (data.chatId && !selectedChatId) {
        setSelectedChatId(data.chatId);
        
        // Refresh the chat list to show the new chat
        const chatRes = await fetch(`/api/chats?userId=${userId}`);
        if (chatRes.ok) {
          const chatData = await chatRes.json();
          setChats(chatData.chats || []);
        }
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        content: "Sorry, there was an error processing your message.",
        sender: 'ai',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setAiResponse("");

    try {
      if (queryMode === 'existing') {
         // Handle querying from existing legal documents
        const formData = new FormData();
        formData.append("query", question);
        const response = await fetch('/api/ai/ask-existing', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setAiResponse(data.answer);
      } else if (queryMode === 'upload') {
        // Handle uploading PDF and querying
        if (!uploadedFile) throw new Error("No file uploaded!");
        const formData = new FormData();
        formData.append("query", question);
        formData.append("file", uploadedFile);

        const response = await fetch('/api/ai/ask-upload', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);

        setFileId(data.file_id);
        setAiResponse(data.answer);
        
        // Save chat with document if it's a new analysis
        if (!selectedChatId) {
          await saveChatWithDocument(question, uploadedFile, data.file_id);
        }
      } else if (queryMode === 'context') {
        // Handle querying using file_id
        if (!fileId) throw new Error("No context available!");
        const formData = new FormData();
        formData.append("query", question);
        formData.append("file_id", fileId);

        const response = await fetch('/api/ai/ask-upload/context', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setAiResponse(data.answer);
      }
    } catch (error) {
      console.error('Error:', error);
      setAiResponse("Sorry, there was an error processing your request.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded || !isSignedIn) return null;

  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar /> {/* Add the Navbar at the top */}
        <main className="flex-1 p-6 flex overflow-hidden">
          {/* Sidebar for previous chats */}
          <div className="h-full overflow-hidden">
            <Sidebar
              userId={isSignedIn ? userId : null}
              onChatSelect={handleChatSelection}
              onNewChat={handleNewChatClick}
            />
          </div>
          {/* Main content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm shadow-2xl border border-white/20 rounded-3xl p-8 space-y-6 mb-8">
              <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-2xl">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-600 to-blue-700 bg-clip-text text-transparent mb-2">
                  Document Analysis Suite
                </h1>
                <p className="text-gray-600 text-lg font-medium">AI-Powered Legal Document Processing & Analysis</p>
                <div className="mt-4 flex justify-center space-x-3">
                  <a
                    href="/consultancy"
                    className="inline-flex items-center px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md transition-all"
                  >
                    👥 Consultancy
                  </a>
                  
                  <a
                    href="/defend-case"
                    className="inline-flex items-center px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all"
                  >
                    ⚖️ Defend Case
                  </a>
                </div>
              </div>

              {/* Query Mode Selection */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Choose Analysis Mode</span>
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setQueryMode('existing');
                      setFileName("");
                      setUploadedFile(null);
                      setFileId(null);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      queryMode === 'existing'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Legal Database</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueryMode('upload')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      queryMode === 'upload'
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Upload PDF</span>
                  </button>
                  {fileId && (
                    <button
                      type="button"
                      onClick={() => setQueryMode('context')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        queryMode === 'context'
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Continue with Uploaded</span>
                    </button>
                  )}
                </div>
              </div>

              {/* File Upload Section - Only show if upload mode */}
              {queryMode === 'upload' && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    📄 Upload Contract (PDF)
                  </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-indigo-600 file:text-white file:font-semibold file:shadow-lg hover:file:from-blue-600 hover:file:to-indigo-700 file:transition-all file:duration-200 border-2 border-dashed border-blue-300 rounded-xl p-4 hover:border-blue-400 transition-colors bg-blue-50/50"
                  />
                </div>
                {fileName && (
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-green-700">📄 {fileName} uploaded</p>
                    <button
                      type="button"
                      onClick={() => setFileName("")}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                      aria-label="Remove file"
                    >
                      {/* Trash bin SVG icon */}
                      <div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          className="h-4 w-4"
                        >
                          <path fill="red" d="M 10.806641 2 C 10.289641 2 9.7956875 2.2043125 9.4296875 2.5703125 L 9 3 L 4 3 A 1.0001 1.0001 0 1 0 4 5 L 20 5 A 1.0001 1.0001 0 1 0 20 3 L 15 3 L 14.570312 2.5703125 C 14.205312 2.2043125 13.710359 2 13.193359 2 L 10.806641 2 z M 4.3652344 7 L 5.8925781 20.263672 C 6.0245781 21.253672 6.877 22 7.875 22 L 16.123047 22 C 17.121047 22 17.974422 21.254859 18.107422 20.255859 L 19.634766 7 L 4.3652344 7 z"></path>
                        </svg>
                      </div>
                    </button>
                  </div>
                )}
                </div>
              )}

              <div className="space-y-3">
                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Ask Your Question</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g., What are the risks for the vendor? What clauses should I pay attention to?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="text-gray-800 w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none shadow-sm bg-white/80 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !question || (queryMode === 'upload' && !uploadedFile) || (queryMode === 'context' && !fileId)}
                  className={`px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ${(loading || !question || (queryMode === 'upload' && !uploadedFile) || (queryMode === 'context' && !fileId)) && "opacity-50 cursor-not-allowed hover:scale-100"
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center space-x-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                      </svg>
                      <span>Analyzing...</span>
                    </span>
                  ) : (
                    "🔍 Analyze Document"
                  )}
                </button>
              </div>

              {aiResponse && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl p-6 shadow-inner">
                  <h2 className="text-xl font-bold mb-3 text-blue-800 flex items-center">
                    <span className="mr-2">🤖</span> AI Analysis Results
                  </h2>
                  <div className="text-gray-700 leading-relaxed bg-white/60 rounded-lg p-4 shadow-sm">
                    <MarkdownRenderer content={aiResponse} />
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Interface */}
            <div className="max-w-3xl mx-auto bg-gradient-to-br from-white via-purple-50/30 to-pink-50/50 backdrop-blur-sm shadow-2xl border border-white/20 rounded-3xl p-8 space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 bg-clip-text text-transparent mb-2">
                  💬 Interactive AI Chat
                </h2>
                <p className="text-gray-600">Have a real-time conversation with your AI legal assistant</p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 border-2 border-blue-100 rounded-2xl p-6 shadow-inner">
                <div className="h-72 overflow-y-auto mb-6 space-y-3 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🤖</div>
                      <p className="text-gray-500 text-lg">
                        Start a conversation with your AI assistant
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Ask questions about contracts, legal terms, or get general legal advice
                      </p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md ${
                            message.sender === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-800'
                          }`}
                        >
                          {message.sender === 'ai' ? (
                          <div
                            className="
                              prose prose-sm max-w-none
                              prose-headings:font-semibold prose-headings:text-gray-900
                              prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900
                              prose-ul:list-disc
                            "
                          >
                            <MarkdownRenderer content={message.content} />
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        )}


                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md">
                        <div className="flex items-center space-x-2">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <p className="text-sm">AI is thinking...</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleSendMessage()}
                    className="text-black flex-1 p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md"
                    placeholder="Ask me anything about legal matters..."
                    disabled={chatLoading}
                  />
                  <button
                    className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:hover:scale-100"
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || chatLoading}
                  >
                    {chatLoading ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                      </svg>
                    ) : (
                      '🚀 Send'
                    )}
                  </button>
                </div>
              </div>
              
              {/* Signature Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => setShowSignatureModal(true)}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                >
                  <span>📝</span>
                  <span>Digital Signature Pad</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Signature Modal */}
          <Modal isOpen={showSignatureModal} onClose={() => setShowSignatureModal(false)}>
            <SignaturePad uploadedFile={uploadedFile} fileName={fileName} />
          </Modal>
        </main>
      </div>
    </>
  );
}
