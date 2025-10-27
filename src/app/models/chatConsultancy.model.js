// src/app/models/chatConsultancy.model.js
import mongoose from "mongoose";

const ChatConsultancySchema = new mongoose.Schema({
  consultationId: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation", required: true, unique: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, default: "Consultation Chat" },
  lastMessage: { type: String, default: "" },
  unreadForClient: { type: Number, default: 0 },
  unreadForLawyer: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.ChatConsultancy || mongoose.model("ChatConsultancy", ChatConsultancySchema);
