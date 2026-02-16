import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model";
import { connectDB } from "@/app/db/connection";

export async function GET(req) {
  try {
    await connectDB(); // ✅ reuse cached connection

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    const chats = await Chat.find({ userId })
      .select("-documentData")
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("GET Chats Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
