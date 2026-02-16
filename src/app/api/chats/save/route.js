import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model.js";
import mongoose from "mongoose";
import { connectDB } from "@/app/db/connection";

export async function POST(req) {
  try {
    const { userId, question, fileName } = await req.json();

    if (!userId || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure mongoose is connected
    await connectDB();
    
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
