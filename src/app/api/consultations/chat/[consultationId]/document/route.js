import { connectDB } from "@/app/db/connection";
import ChatConsultancy from "@/app/models/chatConsultancy.model";
import ConsultationMessage from "@/app/models/consultancyMessage.model";
import Document from "@/app/models/document.model";
import { uploadOnCloudinary } from "@/app/utils/cloudinary";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { writeFile, unlink } from "fs/promises";

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { consultationId } = await params;

    // Parse form data
    const formData = await req.formData();
    const senderId = formData.get("senderId");
    const senderRole = formData.get("senderRole");
    const file = formData.get("file");

    if (!consultationId || !senderId || !senderRole || !file) {
      return NextResponse.json(
        { error: "consultationId, senderId, senderRole, and file are required" },
        { status: 400 }
      );
    }

    // Ensure chat exists
    const chat = await ChatConsultancy.findOne({ consultationId });
    if (!chat)
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    // Temporary folder path
    const tempDir = path.join(process.cwd(), "public", "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // Save file temporarily
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const tempPath = path.join(tempDir, `${Date.now()}-${file.name}`);
    await writeFile(tempPath, fileBuffer);

    // Upload to Cloudinary
    const cloudRes = await uploadOnCloudinary(tempPath);

    if (!cloudRes || !cloudRes.secure_url) {
      return NextResponse.json({ error: "Cloud upload failed" }, { status: 500 });
    }

    // Save document in DB
    const document = await Document.create({
      consultId: consultationId,
      uploadedBy: senderId,
      fileName: file.name,
      filePath: cloudRes.secure_url,
      public_id: cloudRes.public_id,
      fileType: path.extname(file.name).replace(".", ""),
      fileSize: file.size,
    });

    // Save message linking to document
    const message = await ConsultationMessage.create({
      chatId: chat._id,
      senderId,
      senderRole,
      content: file.name,
      contentType: "document",
      documentId: document._id,
      readByClient: senderRole === "lawyer" ? false : true,
      readByLawyer: senderRole === "client" ? false : true,
    });

    // Update chat metadata
    chat.lastMessage = file.name;
    if (senderRole === "client") chat.unreadForLawyer += 1;
    if (senderRole === "lawyer") chat.unreadForClient += 1;
    await chat.save();

    return NextResponse.json({ message, document }, { status: 200 });
  } catch (err) {
    console.error("Document upload error:", err);
    return NextResponse.json(
      { error: "Something went wrong", details: err.message },
      { status: 500 }
    );
  }
}

// --------------------- GET: Retrieve Documents ---------------------
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { consultationId } = await params;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("documentId"); // ?documentId=<id>

    // console.log("in get");

    if (!consultationId) {
      return NextResponse.json(
        { error: "consultationId is required" },
        { status: 400 }
      );
    }

    // ✅ CASE 1: Fetch one document by ID (query param)
    if (documentId) {
      const document = await Document.findById(documentId).lean();
      // console.log(document);

      if (!document) {
        return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ document }, { status: 200 });
    }

    // ✅ CASE 2: Fetch all documents for this consultation
    const documents = await Document.find({ consultId: consultationId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ documents }, { status: 200 });
  } catch (err) {
    console.error("Document fetch error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve documents", details: err.message },
      { status: 500 }
    );
  }
}