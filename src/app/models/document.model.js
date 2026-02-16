import mongoose from "mongoose";

const DocumentSchema = new mongoose.Schema({
  consultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Consultation",
    required: true,
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  public_id: { type: String, required: true, unique: true },
  fileType: {
    type: String,
    enum: ["pdf", "docx", "txt"],
    required: true
  },
  fileSize: { type: Number, required: true },
  resourceType: { type: String, default: "raw" },
}, { timestamps: true });

DocumentSchema.index({ consultId: 1, createdAt: -1 });

export default mongoose.models.Document ||
  mongoose.model("Document", DocumentSchema);
