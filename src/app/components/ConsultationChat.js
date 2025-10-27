'use client';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function ConsultationChat({ consultation, onClose, userId, userRole }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState({}); // ✅ store fetched docs
  const fileInputRef = useRef();
  const messagesEndRef = useRef();

  const consultationId = consultation?._id;

  // ------------------ Fetch Messages ------------------
  const fetchMessages = async () => {
    try {
      const res = await axios.get(`/api/consultations/chat/${consultationId}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  // ------------------ Fetch Single Document ------------------
  const fetchDocument = async (documentId) => {
    if (documents[documentId]) return documents[documentId]; // already cached

    try {
      const res = await axios.get(
        `/api/consultations/chat/${consultationId}/document?documentId=${documentId}`
      );
      const doc = res.data.document;
      if (doc) {
        setDocuments((prev) => ({ ...prev, [documentId]: doc }));
      }
      return doc;
    } catch (err) {
      console.error('Failed to fetch document', err);
      return null;
    }
  };

  // ------------------ Auto Fetch on Load ------------------
  useEffect(() => {
    if (consultationId) fetchMessages();
  }, [consultationId]);

  // ------------------ Scroll to Bottom ------------------
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ------------------ Auto-fetch Docs for Document Messages ------------------
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.contentType === 'document' && msg.documentId) {
        fetchDocument(msg.documentId);
      }
    });
  }, [messages]);

  // ------------------ Send Message ------------------
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const clientRes = await axios.get(`/api/client/${userId}`);
      const actualUserId = clientRes.data.clientId[0]._id;

      const res = await axios.post(`/api/consultations/chat/${consultationId}`, {
        senderId: actualUserId,
        senderRole: userRole, // 'client' or 'lawyer'
        content: newMessage,
      });

      setMessages((prev) => [...prev, res.data.message]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // ------------------ Upload File ------------------
  const uploadFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const clientRes = await axios.get(`/api/client/${userId}`);
      const actualUserId = clientRes.data.clientId[0]._id;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('senderId', actualUserId);
      formData.append('senderRole', userRole);

      const res = await axios.post(
        `/api/consultations/chat/${consultationId}/document`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data',
          timeout: 60000,
          maxBodyLength: Infinity,
         } }
      );

      if (res.data.message) {
        fetchMessages(); // refresh messages
      } else {
        alert(res.data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('File upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  // ------------------ Render ------------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-lg">
            Chat with {consultation.lawyerId?.name || 'Lawyer'}
          </h2>
          <button
            onClick={onClose}
            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Close
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-2 flex flex-col">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className={`p-2 rounded max-w-[80%] ${
                msg.senderRole === userRole
                  ? 'bg-green-100 self-end'
                  : 'bg-gray-200 self-start'
              }`}
            >
              <p>{msg.content}</p>

              {/* ✅ Document Messages */}
              {msg.contentType === 'document' && msg.documentId && (
                <>
                  {documents[msg.documentId] ? (
                    <a
                      href={documents[msg.documentId].filePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline text-sm"
                    >
                      📄 {documents[msg.documentId].fileName}
                    </a>
                  ) : (
                    <p className="text-gray-500 text-sm">Loading document...</p>
                  )}
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </div>

        {/* Input */}
        <div className="p-4 border-t flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => uploadFile(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {uploading ? 'Uploading…' : '📎'}
          </button>
          <button
            onClick={sendMessage}
            className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
