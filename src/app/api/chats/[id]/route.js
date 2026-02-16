import { NextResponse } from "next/server";
import Chat from "@/app/models/chat.model.js";
import { connectDB } from "@/app/db/connection";
import mongoose from "mongoose";

// PATCH
export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Chat ID" }, { status: 400 });
    }

    const body = await req.json();
    const { question } = body;

    const title = question
      ? question.length > 50
        ? question.substring(0, 50) + "..."
        : question
      : undefined;

    const updateData = { ...body };
    if (title) updateData.title = title;

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

// DELETE
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid Chat ID" }, { status: 400 });
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