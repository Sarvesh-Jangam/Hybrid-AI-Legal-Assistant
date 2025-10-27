import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model.js";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    const { userId, question, fileName } = await req.json();

    if (!userId || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure mongoose is connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    
    const chat = await Chat.create({
      userId,
      title:question,
      // response: "This is a sample response from the AI Legal Assistant.",
      fileName: fileName || ""
    });
    return NextResponse.json({ success: true, chat });
  } catch (error) {
    console.error("Error saving chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
