'use client'
import { createContext, useContext, useState, useEffect } from 'react';

const ChatContext = createContext();

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}

export function ChatProvider({ children }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState(null);
  const [question, setQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);



  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setQuestion(chat.question || "");
    setFileName(chat.fileName || "");
  };

  const handleNewChat = () => {
    setSelectedChat(null);
    setQuestion("");
    setFileName("");
  };

//   const loadChats = async (userId) => {
//     try {
//       const res = await fetch(`/api/chats?userId=${userId}`);
//       if (res.ok) {
//         const data = await res.json();
//         // Force a state update by creating a new array
//         setChats([...(data.chats || [])]);
//       }
//     } catch (error) {
//       console.error('Error loading chats:', error);
//     }
//   };

  const value = {
    selectedChat,
    chats,
    question,
    aiResponse,
    fileName,
    loading,
    setSelectedChat,
    setChats,
    setQuestion,
    setAiResponse,
    setFileName,
    setLoading,
    handleChatSelect,
    handleNewChat,
    // loadChats
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
