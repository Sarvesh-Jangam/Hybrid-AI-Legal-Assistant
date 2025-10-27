// src/app/api/consultations/chat/[consultationId]/route.js
import { NextResponse } from "next/server";
import { connectDB } from "@/app/db/connection";
import ChatConsultancy from "@/app/models/chatConsultancy.model.js";
import ConsultationMessage from "@/app/models/consultancyMessage.model.js";
import Document from "@/app/models/document.model.js";
import Consultation from "@/app/models/consultation.model.js";

/**
 * GET: fetch chat + messages + documents for a consultation
 * POST: send a text/document message (body: { senderId, senderRole, content, contentType, documentId? })
 */

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { consultationId } = await params; // params is already an object

    if (!consultationId) {
      return NextResponse.json({ error: "consultationId required" }, { status: 400 });
    }

    const chat = await ChatConsultancy.findOne({ consultationId }).lean();
    if (!chat) {
      // return empty chat info so front-end can create chat if it wants
      return NextResponse.json({ chat: null, messages: [], documents: [] });
    }

    // fetch messages and populate sender basic info
    const messages = await ConsultationMessage.find({ chatId: chat._id })
      .sort({ createdAt: 1 })
      .populate({ path: "senderId", select: "name email" })
      .lean();

    // gather any referenced documents
    const docIds = messages.filter(m => m.documentId).map(m => m.documentId);
    const documents = docIds.length ? await Document.find({ _id: { $in: docIds } }).lean() : [];

    return NextResponse.json({ chat, messages, documents });
  } catch (err) {
    console.error("GET /consultations/chat/[consultationId] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { consultationId } = await params;
    if (!consultationId) {
      return NextResponse.json({ error: "consultationId required" }, { status: 400 });
    }

    const body = await req.json();
    const { senderId, senderRole, content, contentType = "text", documentId = null } = body;

    if (!senderId || !senderRole) {
      return NextResponse.json({ error: "senderId & senderRole required" }, { status: 400 });
    }

    // find or create chat
    let chat = await ChatConsultancy.findOne({ consultationId });
    if (!chat) {
      // try to fetch consultation to populate client/lawyer
      const consultation = await Consultation.findById(consultationId);
      if (!consultation) {
        return NextResponse.json({ error: "Consultation not found" }, { status: 404 });
      }
      chat = await ChatConsultancy.create({
        consultationId,
        clientId: consultation.userId,
        lawyerId: consultation.lawyerId,
        title: `Consultation ${consultation._id}`,
      });
    }

    // create message
    const messageDoc = await ConsultationMessage.create({
      chatId: chat._id,
      senderId,
      senderRole,
      content: content || (contentType === "document" ? "(file)" : ""),
      contentType,
      documentId: documentId || undefined,
    });

    // update chat metadata
    const lastContent = messageDoc.content || (contentType === "document" ? "(file)" : "");
    chat.lastMessage = lastContent;
    if (senderRole === "client") chat.unreadForLawyer = (chat.unreadForLawyer || 0) + 1;
    if (senderRole === "lawyer") chat.unreadForClient = (chat.unreadForClient || 0) + 1;
    await chat.save();

    // populate sender info for response
    await messageDoc.populate({ path: "senderId", select: "name email" });

    return NextResponse.json({ message: messageDoc });
  } catch (err) {
    console.error("POST /consultations/chat/[consultationId] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
