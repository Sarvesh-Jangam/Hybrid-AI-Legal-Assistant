import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  consultId: { type: mongoose.Schema.Types.ObjectId, ref: "Consultation", required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },       // Cloudinary URL or public_id
  public_id: { type: String, required: true },      // Cloudinary public_id
  fileType: { type: String,enum: ["pdf","docx","txt"], default: "pdf"},   // e.g., 'application/pdf'
  fileSize: { type: Number, default: 0 },          // in bytes
  resourceType: { type: String, default: "raw" },  // 'raw' for PDFs/DOCs
}, { timestamps: true });

export default mongoose.models.Document || mongoose.model("Document", DocumentSchema);
