import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true }, // single index for filtering
  title: { type: String, required: true }, //title
  // response: { type: String, default: "" },
  fileName: { type: String, default: "" },
  // Document storage fields
  hasDocument: { type: Boolean, default: false },
  documentData: { type: String, default: "" }, // Base64 encoded document
  documentSize: { type: Number, default: 0 },
  documentType: { type: String, default: "" },
  fileId: { type: String, default: "" } // For linking with AI processing
},{timestamps:true});

ChatSchema.index({ userId: 1, updatedAt: -1 });

// Optional: automatically ensure indexes on startup
mongoose.set("autoIndex", true);

export default mongoose.models.Chat || mongoose.model("Chat", ChatSchema);