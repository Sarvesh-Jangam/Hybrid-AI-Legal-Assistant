import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model.js";
import Message from "@/app/models/message.model.js";
import mongoose from "mongoose";

export async function POST(request) {
    const { prompt, contractText, userId, chatId, saveToHistory = true, uploadedFile, fileId, hasUploadedFile } = await request.json();

    let response;
    let data;

    // Determine which endpoint to use based on context
    if (hasUploadedFile && fileId) {
        // Use context-based chat with uploaded document
        const formData = new FormData();
        formData.append("query", prompt);
        formData.append("file_id", fileId);

        response = await fetch("http://localhost:8000/ask-context", {
            method: "POST",
            body: formData,
        });
    } else if (contractText && contractText.trim()) {
        // Use existing legal database
        const formData = new FormData();
        formData.append("query", prompt);

        response = await fetch("http://localhost:8000/ask-existing", {
            method: "POST",
            body: formData,
        });
    } else {
        // Use general chat
        const formData = new FormData();
        formData.append("query", prompt);

        response = await fetch("http://localhost:8000/chat", {
            method: "POST",
            body: formData,
        });
    }

    data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get AI response');
    }

    // Format the response for better markdown rendering
    if (data.response || data.answer) {
      const responseText = data.response || data.answer;
      // Clean up the response for better markdown rendering
      const formattedResponse = responseText
        .replace(/\n{3,}/g, '\n\n')  // Reduce excessive newlines
        .replace(/^\s*[-*+]\s*/gm, '• ')  // Convert bullet points to consistent format
        .replace(/\*\*\s*/g, '**')  // Clean up bold formatting
        .replace(/\*\s*/g, '*')  // Clean up italic formatting
        .trim();
      
      data.response = formattedResponse;
    }

    // Save to chat history if requested
    if (saveToHistory && userId) {
        try {
            // Ensure mongoose is connected
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect(process.env.MONGODB_URI);
            }

            let currentChatId = chatId;

            // Create new chat if no chatId provided
            if (!currentChatId) {
                const newChat = await Chat.create({
                    userId,
                    title: prompt.length > 50 ? prompt.substring(0, 50) + "..." : prompt,
                    fileName: contractText || ""
                });
                currentChatId = newChat._id.toString();
            }

            // Save user message
            await Message.create({
                chatId: currentChatId,
                sender: "user",
                content: prompt
            });

            // Save AI response (handle different response formats)
            const aiResponse = data.response || data.answer || data.comparison_analysis || 'No response generated';
            await Message.create({
                chatId: currentChatId,
                sender: "ai",
                content: aiResponse
            });

            return NextResponse.json({ 
                response: aiResponse, 
                chatId: currentChatId,
                saved: true 
            });
        } catch (dbError) {
            console.error('Error saving to chat history:', dbError);
            // Still return the AI response even if saving fails
            return NextResponse.json({ 
                response: data.response || data.answer || data.comparison_analysis || 'No response generated', 
                saved: false,
                error: 'Failed to save chat history'
            });
        }
    }

    return NextResponse.json({ 
        response: data.response || data.answer || data.comparison_analysis || 'No response generated' 
    });
}

