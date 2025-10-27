import { NextResponse } from "next/server";
import { connectDB } from "@/app/db/connection";
import Consultation from "@/app/models/consultation.model";
import User from "@/app/models/user.model";
import consultationModel from "@/app/models/consultation.model";

// GET /api/consultations?userId=clerkUserId
export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    // Find the app-level user document to join by _id
    const userDoc = await User.findOne({ userId }).select("_id").lean();

    if (!userDoc) {
      return NextResponse.json({ consultations: [] });
    }

    const consultations = await Consultation.aggregate([
      { $match: { userId: userDoc._id } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "client"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "lawyerId",
          foreignField: "_id",
          as: "lawyer"
        }
      },
      { $unwind: "$client" },
      { $unwind: "$lawyer" },
      {
        $project: {
          _id: 1,
          client: { _id: 1, name: 1, email: 1 },
          lawyer: { _id: 1, name: 1, role: 1, specialization: 1, feePerHour: 1 },
          dateTime: 1,
          mode: 1,
          status: 1,
          meetingLink: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      },
      { $sort: { dateTime: -1 } }
    ]);


    return NextResponse.json({ consultations });
  } catch (error) {
    console.error("Error fetching consultations:", error);
    return NextResponse.json({ error: "Failed to fetch consultations" }, { status: 500 });
  }
}

// POST /api/consultations
// body: { userId: clerkUserId, lawyerUserId: clerkUserId, dateTime, mode }
export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();

    const { userId, lawyerUserId, dateTime, mode } = body;
    if (!userId || !lawyerUserId || !dateTime) {
      return NextResponse.json({ error: "userId, lawyerUserId and dateTime are required" }, { status: 400 });
    }

    const clientDoc = await User.findOne({ userId }).select("_id").lean();
    const lawyerDoc = await User.findOne({ userId: lawyerUserId, role: "lawyer" }).select("_id").lean();

    if (!clientDoc || !lawyerDoc) {
      return NextResponse.json({ error: "Invalid client or lawyer" }, { status: 400 });
    }
    

    const created = await Consultation.create({
      userId: clientDoc._id,
      lawyerId: lawyerDoc._id,
      dateTime: new Date(dateTime),
      mode: mode || "chat",
      meetingLink: mode === "video" ? "https://us05web.zoom.us/j/8859803779?pwd=xkCE0JgVRRcoCHL7aunDWVBgyVfoHt.1" : null,
    });

    return NextResponse.json({ success: true, consultation: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating consultation:", error);
    return NextResponse.json({ error: "Failed to create consultation" }, { status: 500 });
  }
}



