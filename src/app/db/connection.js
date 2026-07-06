import mongoose from "mongoose";
import dns from "node:dns/promises";

dns.setServers(["1.1.1.1"]);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {

  const MONGODB_URI = process.env.MONGODB_URI;
  const DB_NAME = process.env.DB_NAME;

  // check env variables at runtime
  if (!MONGODB_URI || !DB_NAME) {
    throw new Error("❌ Missing MongoDB environment variables.");
  }

  if (cached.conn) {
    return cached.conn;
  }

  const uri = `${MONGODB_URI}/${DB_NAME}`;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;

  return cached.conn;
};