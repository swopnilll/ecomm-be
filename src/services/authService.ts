import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { validateCreateUser, validateLoginUser, type CreateUserInput, type IUser, type LoginUserInput } from "#models/user.js";
import { createUser, findByEmail } from "#repositories/userRepository.js";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

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

export const loginUser = async (data: unknown): Promise<{ user: IUser; token: string }> => {
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

  // Generate JWT
  const token = jwt.sign({ _id: (user._id as string | number | { toString(): string }).toString(), role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return { user, token };
};
