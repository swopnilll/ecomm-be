import mongoose from "mongoose";

const URL = process.env.url;

if (!URL) {
  throw new Error("Database URL is not defined in environment variables");
}

const connectToDatabase = async () => {
  try {
    await mongoose.connect(URL);
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Exit the process with failure
  }
};

export default connectToDatabase;
