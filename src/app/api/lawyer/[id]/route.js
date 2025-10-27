import { connection, NextResponse } from "next/server";
import {Lawyer} from "@/app/models/lawyer.model";
import User from "@/app/models/user.model";
import Consultation from "@/app/models/consultation.model"; // assuming you have this
import { connectDB } from "@/app/db/connection";

// GET /api/lawyer/[id]
export async function GET(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Lawyer ID is required" }, { status: 400 });
    }

    const lawyer = await User.findOne({ userId: id, role: "lawyer" })
      .select("name specialization feePerHour verificationStatus role connection_link");

    if (!lawyer) {
      console.error("Error fetching lawyer details:");
      return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
    }

    const consultations = await Consultation.find({ lawyerId: lawyer._id })
      .populate({ path: 'userId', select: 'name email' })
      .sort({ dateTime: -1 });

    return NextResponse.json({ profile: lawyer, 
      consultations 
    });
  } catch (error) {
    console.error("Error fetching lawyer details:", error);
    return NextResponse.json({ error: "Failed to fetch lawyer details" }, { status: 500 });
  }
}

// POST /api/lawyer/[id]
export async function POST(request, { params }) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Lawyer ID is required" }, { status: 400 });
    }
    const body=await request.json();
    await Lawyer.create({
      userId: id,                     // Clerk user ID
      name: body.name,                // from form
      email: body.email,              // from form
      phone: body.phone || "",        // optional
      passwordHash: body.passwordHash || "", // optional if using Clerk
      specialization: body.specialization,
      barId: body.barId,
      experience: body.experience,
      connection_link: body.connection_link,
      feePerHour: body.feePerHour,
      availabilitySchedule: body.availabilitySchedule || [], // optional
      verificationStatus: "pending",  // default status
    });

    const lawyer = await User.findOne({ userId: id, role: "lawyer" })
      .select("name specialization feePerHour verificationStatus role connection_link");

    return NextResponse.json({ profile: lawyer
    });
  } catch (error) {
    console.error("Error saving new lawyer details:", error);
    return NextResponse.json({ error: "Failed to save new lawyer details" }, { status: 500 });
  }
}
