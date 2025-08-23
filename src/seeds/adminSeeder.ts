import bcrypt from "bcrypt";

import User from "#models/user.js";
import logger from "#utils/logger.js";

export const seedAdmin = async () => {
  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    logger.info(`✅ Admin already exists: ${existingAdmin.email}`);
    return;
  }

  // TODO: Remove Default Password before Deployment
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin@123", 10);

  const admin = await User.create({
    email: process.env.ADMIN_EMAIL || "admin@example.com",
    password: hashedPassword,
    role: "admin",
    firstName: "Super",
    lastName: "Admin",
  });

  logger.info(`Admin user created: ${admin.email}`);
};
