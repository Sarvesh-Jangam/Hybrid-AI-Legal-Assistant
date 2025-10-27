import User from './user.model.js';
import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  subscriptionType: { type: String, enum: ["free", "premium"], default: "free" },
  walletBalance: { type: Number, default: 0 },
});

export const Client = User.discriminator("client", ClientSchema);
