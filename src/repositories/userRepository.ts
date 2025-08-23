import User, { type CreateUserInput, type IUser } from "#models/user.js";

export const findByEmail = async (email: string): Promise<IUser | null> => {
  return User.findOne({ email }).exec();
};

export const createUser = async (data: CreateUserInput): Promise<IUser> => {
  const user = new User(data);

  return user.save();
};
