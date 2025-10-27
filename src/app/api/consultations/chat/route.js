import { NextResponse } from "next/server";
import {connectDB} from "@/app/db/connection";
import ChatConsultancy from "@/app/models/chatConsultancy.model";
import Consultation from "@/app/models/consultation.model";

/**
 * GET: list all consultation chats for a user
 * POST: create chatConsultancy for a consultation if it doesn't exist
 */
export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const chats = await ChatConsultancy.find({
    $or: [{ clientId: userId }, { lawyerId: userId }]
  }).sort({ updatedAt: -1 }).lean();

  return NextResponse.json({ chats });
}

export async function POST(req) {
  await connectDB();
  const body = await req.json();
  const { consultationId } = body;
  if (!consultationId) return NextResponse.json({ error: "consultationId required" }, { status: 400 });

  const consultation = await Consultation.findById(consultationId);
  if (!consultation) return NextResponse.json({ error: "Consultation not found" }, { status: 404 });

  let chat = await ChatConsultancy.findOne({ consultationId });
  if (!chat) {
    chat = await ChatConsultancy.create({
      consultationId,
      clientId: consultation.userId,
      lawyerId: consultation.lawyerId,
      title: `Consultation ${consultation._id}`,
    });
  }

  return NextResponse.json({ chat });
}
