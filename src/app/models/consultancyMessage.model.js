// src/app/models/consultationMessage.model.js
import mongoose from "mongoose";

const ConsultationMessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "ChatConsultancy", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderRole: { type: String, enum: ["client", "lawyer", "system"], default: "client" },
  content: { type: String, default: "" },
  contentType: { type: String, enum: ["text", "document"], default: "text" },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document" }, // for uploaded files
  readByClient: { type: Boolean, default: false },
  readByLawyer: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.ConsultationMessage || mongoose.model("ConsultationMessage", ConsultationMessageSchema);
