import mongoose, { Document } from "mongoose";
import { z } from "zod";

// Zod schema for validation
export const UserZodSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  name: z.string().min(1, "Name is required").trim(),
  email: z.email("Invalid email format").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  avatarUrl: z.url("Invalid URL format").optional(),
});

// Zod schema for creating a user (excludes auto-generated fields)
export const CreateUserZodSchema = UserZodSchema;

export const UpdateUserZodSchema = UserZodSchema.partial();

// TypeScript interface from Zod schema
export type UserInput = z.infer<typeof UserZodSchema>;
export type CreateUserInput = z.infer<typeof CreateUserZodSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserZodSchema>;

// TypeScript interface for the complete document (includes Mongoose additions)
export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  avatarUrl?: string;
}

// Mongoose schema
const usersSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  avatarUrl: {
    type: String,
    required: false,
  },
});

usersSchema.index({ email: 1 });
usersSchema.index({ username: 1 });

const User = mongoose.model<IUser>("User", usersSchema);

export default User;

// Utility functions for validation
export const validateUser = (data: unknown): UserInput => {
  return UserZodSchema.parse(data);
};

export const validateCreateUser = (data: unknown): CreateUserInput => {
  return CreateUserZodSchema.parse(data);
};

export const validateUpdateUser = (data: unknown): UpdateUserInput => {
  return UpdateUserZodSchema.parse(data);
};

// Safe validation functions that return result objects instead of throwing
export const safeValidateUser = (data: unknown) => {
  return UserZodSchema.safeParse(data);
};

export const safeValidateCreateUser = (data: unknown) => {
  return CreateUserZodSchema.safeParse(data);
};

export const safeValidateUpdateUser = (data: unknown) => {
  return UpdateUserZodSchema.safeParse(data);
};
