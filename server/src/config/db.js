import mongoose from "mongoose";
import { env } from "./env.js";
let isConnected = false;
const connectDB = async () => {
  if (isConnected) {
    return mongoose;
  }
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5e3,
      autoIndex: true
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    if (env.NODE_ENV === "production") {
      process.exit(1);
    }
    return null;
  }
};
const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    console.log("MongoDB disconnected successfully");
  }
};
export {
  connectDB,
  disconnectDB
};
