import { NextResponse } from "next/server";
import User from "@/app/models/user.model";
import { connectDB } from "@/app/db/connection";

// GET /api/client/[userId]
export async function GET(req,{params}) {
  try {
    await connectDB();
    const {userId}=await params;
    const clientId = await User.find({userId})
      .select("_id");

    return NextResponse.json({ clientId });
  } catch (error) {
    console.error("Error fetching clientId:", error);
    return NextResponse.json({ error: "Failed to fetch clientId" }, { status: 500 });
  }
}
