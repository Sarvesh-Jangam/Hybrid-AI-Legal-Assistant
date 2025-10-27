import Consultation from "@/app/models/consultation.model";
import { connectDB } from "@/app/db/connection";

export async function PATCH(req, { params }) {
  try {
    await connectDB(); // make sure DB is connected

    const { id } = await params;
    const consultation = await Consultation.findById(id);

    if (!consultation) 
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });

    consultation.status = "booked";
    await consultation.save();

    return new Response(JSON.stringify({ success: true, consultation }), { status: 200 });
  } catch (err) {
    console.error("Error confirming consultation:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
