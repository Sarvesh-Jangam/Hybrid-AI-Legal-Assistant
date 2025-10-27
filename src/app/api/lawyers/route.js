import { NextResponse } from "next/server";
import User from "@/app/models/user.model";
import { connectDB } from "@/app/db/connection";

// GET /api/lawyers → list available lawyers
export async function GET() {
  try {
    await connectDB();
    const lawyers = await User.find({ role: "lawyer" })
      .select("_id userId name email phone specialization feePerHour verificationStatus role")
      .lean();

    return NextResponse.json({ lawyers });
  } catch (error) {
    console.error("Error fetching lawyers:", error);
    return NextResponse.json({ error: "Failed to fetch lawyers" }, { status: 500 });
  }
}




