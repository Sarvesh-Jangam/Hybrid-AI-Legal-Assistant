import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  consultId: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation", required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed", "refunded"], default: "pending" },
  commission: { type: Number, default: 0 }, 
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
