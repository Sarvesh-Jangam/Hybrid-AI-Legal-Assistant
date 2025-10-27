import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model.js";
import mongoose from "mongoose";
import { base64ToFile } from "@/app/utils/documentStorage.js";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Ensure mongoose is connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const chat = await Chat.findById(id);
    
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (!chat.hasDocument || !chat.documentData) {
      return NextResponse.json({ error: "No document found for this chat" }, { status: 404 });
    }

    // Convert base64 back to file data
    const fileBuffer = Buffer.from(chat.documentData, 'base64');
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': chat.documentType || 'application/pdf',
        'Content-Disposition': `attachment; filename="${chat.fileName}"`,
        'Content-Length': chat.documentSize.toString(),
      },
    });
    
  } catch (error) {
    console.error("Error retrieving document:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get document info without downloading
export async function HEAD(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Ensure mongoose is connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const chat = await Chat.findById(id).select('hasDocument fileName documentSize documentType');
    
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (!chat.hasDocument) {
      return NextResponse.json({ error: "No document found for this chat" }, { status: 404 });
    }

    return NextResponse.json({
      hasDocument: true,
      fileName: chat.fileName,
      documentSize: chat.documentSize,
      documentType: chat.documentType
    });
    
  } catch (error) {
    console.error("Error getting document info:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
