import mongoose from "mongoose";

const URL = process.env.MONGO_URI;

if (!URL) {
  throw new Error("Database URL is not defined in environment variables (expecting 'url' or 'MONGODB_URI')");
}

const connectToDatabase = async () => {
  try {
    await mongoose.connect(URL);

    console.log("✅ MongoDB connected successfully");

    // Handle connection events
    mongoose.connection.on("error", (error) => {
      console.error("❌ MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB disconnected");
    });

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("🔒 MongoDB connection closed through app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error connecting to the database:", error);
    process.exit(1);
  }
};

export default connectToDatabase;
