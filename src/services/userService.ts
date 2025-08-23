import bcrypt from "bcrypt";
import mongoose from "mongoose";

import {
  blockUser,
  createUser,
  emailExists,
  findAllUsers,
  findUserByEmail,
  findUserById,
  findUsersByRole,
  softDeleteUser,
  unblockUser,
  updateUserById,
  type PaginatedResult,
  type PaginationOptions,
  type UserFilters,
} from "#repositories/userRepository.js";
import logger from "#utils/logger.js";
import { sanitizeUser } from "#utils/sanitizeUser.js";
import { EmailAlreadyExistsError, UnauthorizedError, UserNotFoundError } from "#utils/errors.js";
import { validateCreateUser, validateUpdateUser, type CreateUserInput, type IUser, type UpdateUserInput } from "#models/user.js";

export const getAllUsers = async (filters: UserFilters = {}, options: PaginationOptions = {}): Promise<PaginatedResult<IUser>> => {
  return findAllUsers(filters, options);
};

export const getUserById = async (id: string): Promise<Partial<IUser>> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new UserNotFoundError();
  }

  const user = await findUserById(id);

  if (!user) {
    logger.error(`User not found: ${id}`);
    throw new UserNotFoundError();
  }

  return sanitizeUser(user);
};

export const createEmployee = async (userData: CreateUserInput): Promise<Partial<IUser>> => {
  // Validate input
  const validatedData = validateCreateUser(userData);

  // Setting role to employee
  validatedData.role = "employee";

  // Check if email already exists
  const emailAlreadyExists = await emailExists(validatedData.email);
  if (emailAlreadyExists) {
    throw new EmailAlreadyExistsError();
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  // Create user
  const user = await createUser({
    ...validatedData,
    password: hashedPassword,
  });

  return sanitizeUser(user);
};

export const validateUserPermissions = (currentUser: IUser, targetUserId?: string, requiredRole?: "admin" | "employee"): void => {
  // Check if user is blocked
  if (currentUser.isBlocked) {
    throw new UnauthorizedError("User account is blocked");
  }

  // Check role requirements
  if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== "admin") {
    throw new UnauthorizedError(`${requiredRole} role required`);
  }

  // Check if user is trying to access their own data (for self-management endpoints)
  if (targetUserId && (currentUser._id as { toString(): string }).toString() !== targetUserId && currentUser.role !== "admin") {
    throw new UnauthorizedError("Can only access own data");
  }
};

export const blockUserById = async (id: string): Promise<Partial<IUser>> => {
  const user = await blockUser(id);

  if (!user) {
    throw new UserNotFoundError();
  }

  return sanitizeUser(user);
};

export const unblockUserById = async (id: string): Promise<IUser> => {
  const user = await unblockUser(id);

  if (!user) {
    throw new UserNotFoundError();
  }

  return user;
};

export const deleteUserById = async (id: string): Promise<Partial<IUser>> => {
  const user = await softDeleteUser(id);

  if (!user) {
    throw new UserNotFoundError();
  }

  return sanitizeUser(user);
};

export const updateOwnProfile = async (userId: string, updateData: UpdateUserInput): Promise<Partial<IUser>> => {
  const validatedData = validateUpdateUser(updateData);

  // Check if email is being changed
  if (validatedData.email) {
    const emailAlreadyExists = await emailExists(validatedData.email);
    if (emailAlreadyExists) throw new EmailAlreadyExistsError();
  }

  const updatedUser = await updateUserById(userId, validatedData);
  if (!updatedUser) throw new UserNotFoundError();

  return sanitizeUser(updatedUser);
};

export const getOwnProfile = async (userId: string): Promise<Partial<IUser>> => {
  const user = await findUserById(userId);

  if (!user) {
    throw new UserNotFoundError();
  }

  return sanitizeUser(user);
};

export const adminUpdateUser = async (id: string, updateData: UpdateUserInput): Promise<Partial<IUser>> => {
  // Validate input
  const validatedData = validateUpdateUser(updateData);

  // Check if email is being changed and if it already exists
  if (validatedData.email) {
    const existingUser = await findUserByEmail(validatedData.email);
    if (existingUser && (existingUser._id as { toString(): string }).toString() !== id) {
      throw new EmailAlreadyExistsError();
    }
  }

  // Hash password if it's being updated
  if (validatedData.password) {
    validatedData.password = await bcrypt.hash(validatedData.password, 12);
  }

  const user = await updateUserById(id, validatedData);

  if (!user) {
    throw new UserNotFoundError();
  }

  return sanitizeUser(user);
};

export const getUsersByRole = async (role: "admin" | "employee" | "customer"): Promise<IUser[]> => {
  return findUsersByRole(role);
};
