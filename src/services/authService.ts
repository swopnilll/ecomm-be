import bcrypt from "bcrypt";

import { validateCreateUser, type CreateUserInput, type IUser } from "#models/user.js";
import { createUser, findByEmail } from "#repositories/userRepository.js";

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
