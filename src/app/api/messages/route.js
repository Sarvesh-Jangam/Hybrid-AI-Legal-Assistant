import { connectDB } from "@/app/db/connection";
import { NextResponse } from "next/server";
import Message from "@/app/models/message.model";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }
    
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { chatId, messages } = await request.json();
    
    if (!chatId || !messages) {
      return NextResponse.json({ error: "Chat ID and messages are required" }, { status: 400 });
    }
    
    // Save multiple messages
    const savedMessages = [];
    for (const messageData of messages) {
      const message = await Message.create({
        chatId,
        sender: messageData.sender,
        content: messageData.content
      });
      savedMessages.push(message);
    }
    
    return NextResponse.json({ messages: savedMessages });
  } catch (error) {
    console.error('Error saving messages:', error);
    return NextResponse.json({ error: "Failed to save messages" }, { status: 500 });
  }
}
