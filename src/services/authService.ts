import ms from "ms";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { validateCreateUser, validateLoginUser, type CreateUserInput, type IUser, type LoginUserInput } from "#models/user.js";
import { createUser, findByEmail, findById } from "#repositories/userRepository.js";
import logger from "#utils/logger.js";

const JWT_SECRET = process.env.JWT_SECRET as string;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

if (!REFRESH_TOKEN_SECRET) {
  throw new Error("REFRESH_TOKEN_SECRET environment variable is not set");
}

const ACCESS_TOKEN_EXPIRES = (process.env.ACCESS_TOKEN_EXPIRES_IN || "1h") as ms.StringValue;
const REFRESH_TOKEN_EXPIRES = (process.env.REFRESH_TOKEN_EXPIRES_IN || "7d") as ms.StringValue;

export const registerUser = async (data: unknown): Promise<IUser> => {
  const validatedUser: CreateUserInput = validateCreateUser(data);

  const existingUser: IUser | null = await findByEmail(validatedUser.email);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword: string = await bcrypt.hash(validatedUser.password, 10);
  validatedUser.password = hashedPassword;

  const newUser: IUser = await createUser(validatedUser);

  return newUser;
};

export const loginUser = async (data: unknown): Promise<{ user: IUser; accessToken: string; refreshToken: string }> => {
  const { email, password }: LoginUserInput = validateLoginUser(data);

  // Find user
  const user = await findByEmail(email);
  if (!user) {
    throw new Error("Email not Found");
  }

  // Check if blocked
  if (user.isBlocked) {
    throw new Error("User account is blocked");
  }

  // Compare password
  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    throw new Error("Invalid password for the email");
  }

  const payload = { _id: (user._id as { toString(): string }).toString(), role: user.role };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ms(ACCESS_TOKEN_EXPIRES) });
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: ms(REFRESH_TOKEN_EXPIRES) });

  return { user, accessToken, refreshToken };
};

export const refreshToken = (token: string): { accessToken: string } => {
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as { _id: string; role: string };

    const accessToken = jwt.sign({ _id: payload._id, role: payload.role }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });

    return { accessToken };
  } catch (error) {
    logger.error("Refresh token error:", error);
    throw new Error("Invalid refresh token");
  }
};

export const getUserById = async (id: string): Promise<IUser> => {
  const user = await findById(id);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};
