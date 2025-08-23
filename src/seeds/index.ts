import mongoose from "mongoose";

import logger from "#utils/logger.js";
import connectToDatabase from "#db/db.js";
import { seedAdmin } from "./adminSeeder.js";

const runSeeds = async () => {
  try {
    await connectToDatabase(); // Connect once

    await seedAdmin(); // Run all seeders sequentially
  } catch (error) {
    logger.error("❌ Seeding failed:", error);
  } finally {
    await mongoose.disconnect(); // Disconnect once at the end
    process.exit(0);
  }
};

runSeeds();
