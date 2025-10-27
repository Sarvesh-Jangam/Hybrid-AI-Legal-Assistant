import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model.js";
import mongoose from "mongoose";
import { prepareDocumentForStorage } from "@/app/utils/documentStorage.js";

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
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    let chatData = {
      userId,
      title: question,
      fileName: fileName || "",
      fileId: fileId || ""
    };

    // If document is provided, prepare it for storage
    if (documentFile && documentFile.size > 0) {
      try {
        console.log('Processing document for storage:', documentFile.name, documentFile.size);
        const documentData = await prepareDocumentForStorage(documentFile);
        chatData = { ...chatData, ...documentData };
        console.log('Document processed successfully');
      } catch (docError) {
        console.error('Error processing document:', docError);
        return NextResponse.json({ 
          error: `Document processing failed: ${docError.message}` 
        }, { status: 400 });
      }
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
