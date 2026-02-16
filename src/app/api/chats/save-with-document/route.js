import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model.js";
import mongoose from "mongoose";
import { prepareDocumentForStorage } from "@/app/utils/documentStorage.js";
import { connectDB } from "@/app/db/connection";

export async function POST(req) {
  try {
    const formData = await req.formData();
    
    const userId = formData.get('userId');
    const question = formData.get('question');
    const fileName = formData.get('fileName');
    const fileId = formData.get('fileId');
    const documentFile = formData.get('document'); // File object

    if (!userId || !question) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Ensure mongoose is connected
    await connectDB();

    let chatData = {
      userId,
      title: question,
      fileName: fileName || "",
      fileId: fileId || ""
    };

    // If document is provided, prepare it for storage
    if (documentFile && documentFile.size > 0) {
      chatData.hasDocument = true;
    }
    
    const chat = await Chat.create(chatData);
    
    return NextResponse.json({ 
      success: true, 
      chat,
      documentStored: !!documentFile && documentFile.size > 0
    });
    
  } catch (error) {
    console.error("Error saving chat:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
