import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME;

if (!MONGODB_URI || !DB_NAME) {
  throw new Error("❌ Missing MongoDB environment variables.");
}

// Global cache to reuse connection across hot reloads (important for Next.js)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  // If connection already established, reuse it
  if (cached.conn) {
    try {
      await cached.conn.connection.db.admin().ping();
      console.log("✅ Using existing MongoDB connection");
      return cached.conn;
    } catch (err) {
      console.warn("⚠️ Existing connection stale. Reconnecting...");
      await mongoose.disconnect();
      cached.conn = null;
    }
  }

  // If connection promise already exists, wait for it
  if (!cached.promise) {
    const uri = `${MONGODB_URI}/${DB_NAME}`;
    console.log("⏳ Connecting to MongoDB...");

    cached.promise = mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // give Atlas time to wake up
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`✅ MongoDB connected! DB Name: ${cached.conn.connection.name}`);
    return cached.conn;
  } catch (err) {
    cached.promise = null; // reset promise if failed
    console.error("❌ MongoDB connection failed:", err);
    throw err;
  }
};
