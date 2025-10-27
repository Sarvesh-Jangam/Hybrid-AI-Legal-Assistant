import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model.js";
import mongoose from "mongoose";

// Edit chat
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { question } = body;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Update title when question changes
    const title = question ? (question.length > 50 ? question.substring(0, 50) + "..." : question) : undefined;
    const updateData = { ...body };
    if (title) {
      updateData.title = title;
    }

    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json(updatedChat);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete chat
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const deletedChat = await Chat.findByIdAndDelete(id);

    if (!deletedChat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
