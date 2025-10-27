import mongoose from "mongoose";
import User from './user.model.js';

const AdminSchema = new mongoose.Schema({}, { timestamps: true });

// Just one super admin role
export const Admin = User.discriminator("admin", AdminSchema);
