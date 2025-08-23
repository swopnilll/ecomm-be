import mongoose from "mongoose";

import logger from "#utils/logger.js";

const URL = process.env.MONGO_URI;

if (!URL) {
  throw new Error("Database URL is not defined in environment variables (expecting 'url' or 'MONGODB_URI')");
}

const connectToDatabase = async () => {
  try {
    await mongoose.connect(URL);

    logger.info("✅ MongoDB connected successfully");

    // Handle connection events
    mongoose.connection.on("error", (error) => {
      logger.error("❌ MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("⚠️  MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      logger.info("🔒 MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    logger.error("❌ Error connecting to the database:", error);
    process.exit(1);
  }
};

export default connectToDatabase;
