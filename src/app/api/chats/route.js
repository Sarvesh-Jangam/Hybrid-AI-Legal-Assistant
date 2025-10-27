import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model.js";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    // Get userId from query params
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Ensure mongoose is connected (if not already)
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Fetch chats for the user, sorted by most recent
    const chats = await Chat.find({ userId })
    .sort({ updatedAt: -1 })
    .limit(20)
    .allowDiskUse(true)
    .lean();

    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
