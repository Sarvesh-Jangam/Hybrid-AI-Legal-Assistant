import { useEffect, useState } from "react";
import { useChatContext } from "../context/userContextProvider";
import { chatService } from "../services/chatService";

export default function Sidebar({ onChatSelect, onNewChat, userId }) {
  const {chats, setChats} = useChatContext();
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  // Derive loading from chats presence to prevent unnecessary reload flashes on navigation
  const isLoading = chats === null;

  useEffect(() => {
    // No-op effect kept only if future side-effects are needed when chats change
  }, [chats]);

  return (
    <aside className="w-64 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 shadow-xl rounded-2xl p-6 mr-8 flex flex-col h-[calc(100vh-7rem)] border border-indigo-100/50">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Chat History</h2>
      </div>
      <ul className="space-y-4 flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-col space-y-4 p-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : chats?.length === 0 || !chats ? (
          <li className="text-gray-500">No previous chats</li>
        ) : (
          chats.map((chat) => (
            <li
              key={chat._id}
              className="p-3 rounded-lg bg-white/90 hover:bg-blue-50/80 text-gray-800 flex items-center justify-between group shadow-sm border border-gray-200/50 mb-2 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex-1 mr-2">
                {editingId === chat._id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        try {
                          await chatService.updateChat(chat._id, {
                            title: editText
                          });
                          setChats(prevChats => 
                            prevChats.map(c => 
                              c._id === chat._id ? { ...c,title: editText } : c
                            )
                          );
                          setEditingId(null);
                        } catch (error) {
                          console.error('Error updating chat:', error);
                          alert(error.message);
                        }
                      } else if (e.key === 'Escape') {
                        setEditingId(null);
                      }
                    }}
                    className="w-full px-2 py-1 rounded border border-gray-300 focus:border-blue-500 focus:outline-none"
                    autoFocus
                    onBlur={() => setEditingId(null)}
                  />
                ) : (
                  <div 
                    className="cursor-pointer flex items-center space-x-2"
                    onClick={() => onChatSelect && onChatSelect(chat)}
                  >
                    <span className="flex-1">{chat.title || "Untitled Chat"}</span>
                    {chat.hasDocument && (
                      <span 
                        className="text-indigo-500 text-xs flex items-center p-1 bg-indigo-50 rounded"
                        title={`Document: ${chat.fileName}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(chat._id);
                    setEditText(chat.title || "");
                  }}
                  className="p-1 hover:bg-blue-200 rounded"
                  title="Edit"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    // if (window.confirm('Are you sure you want to delete this chat?')) {
                      try {
                        const result = await chatService.deleteChat(chat._id);
                        if (result.success) {
                          setChats(prevChats => prevChats.filter(c => c._id !== chat._id));
                        }
                      } catch (error) {
                        console.error('Error deleting chat:', error);
                        alert(error.message);
                      }
                    // }
                  }}
                  className="p-1 hover:bg-red-200 rounded"
                  title="Delete"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
      <button
        className="mt-4 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:hover:scale-100 flex items-center justify-center space-x-2"
        onClick={onNewChat}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Loading...</span>
          </div>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>New Chat</span>
          </>
        )}
      </button>
    </aside>
  );
}
