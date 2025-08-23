// src/utils/sanitizeUser.ts
import { type IUser } from "#models/user.js";

export const sanitizeUser = (user: IUser): Partial<IUser> => {
  if (!user) return {};

  const sanitized = user.toObject ? user.toObject() : { ...user };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.resetPasswordToken;
  delete sanitized.resetPasswordExpires;

  return sanitized;
};
