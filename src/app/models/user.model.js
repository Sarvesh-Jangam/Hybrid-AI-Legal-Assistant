import mongoose from "mongoose";
const options = { discriminatorKey: "role", timestamps: true };

const BaseUserSchema = new mongoose.Schema({
  userId: {type: String, required: true},
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String },
}, options);

const User = mongoose.models.User || mongoose.model("User", BaseUserSchema);
export default User;
