import { connectDB } from "@/app/db/connection";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();

    return NextResponse.json({
      success: true,
      message: "Database connected successfully",
    });
  } catch (error) {
    console.error("DB Route Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to database",
      },
      { status: 500 }
    );
  }
}
