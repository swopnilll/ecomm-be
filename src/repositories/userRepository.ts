import User, { type CreateUserInput, type IUser } from "#models/user.js";
import type { FilterQuery, UpdateQuery } from "mongoose";

export interface UserFilters {
  role?: "admin" | "employee" | "customer";
  isBlocked?: boolean;
  email?: string;
  searchTerm?: string; // Search in firstName, lastName, or email
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const findAllUsers = async (filters: UserFilters = {}, options: PaginationOptions = {}): Promise<PaginatedResult<IUser>> => {
  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc" } = options;

  // Build query
  const query: FilterQuery<IUser> = {};

  if (filters.role) {
    query.role = filters.role;
  }

  if (filters.isBlocked !== undefined) {
    query.isBlocked = filters.isBlocked;
  }

  if (filters.email) {
    query.email = new RegExp(filters.email, "i");
  }

  if (filters.searchTerm) {
    query.$or = [
      { firstName: new RegExp(filters.searchTerm, "i") },
      { lastName: new RegExp(filters.searchTerm, "i") },
      { email: new RegExp(filters.searchTerm, "i") },
    ];
  }

  const queryWithSoftDelete = { ...query, isDeleted: { $ne: true } };

  // Calculate pagination
  const skip = (page - 1) * limit;
  const sortOptions: Record<string, 1 | -1> = {};
  sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

  // Execute queries
  const [data, totalCount] = await Promise.all([
    User.find(queryWithSoftDelete)
      .select("-password") // not including password in results
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(queryWithSoftDelete),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    data: data as IUser[],
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

export const findByEmail = async (email: string): Promise<IUser | null> => {
  return User.findOne({ email }).exec();
};

export const createUser = async (data: CreateUserInput): Promise<IUser> => {
  const user = new User(data);

  return user.save();
};

export const findById = async (id: string): Promise<IUser | null> => {
  return User.findById(id).exec();
};

export const findUserById = async (id: string): Promise<IUser | null> => {
  return User.findById(id).select("-password").lean();
};

export const findUserByEmail = async (email: string): Promise<IUser | null> => {
  return User.findOne({ email }).select("-password").lean();
};

export const findUserByEmailWithPassword = async (email: string): Promise<IUser | null> => {
  return User.findOne({ email }).lean();
};

export const updateUserById = async (id: string, updateData: UpdateQuery<IUser>): Promise<IUser | null> => {
  return User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
    select: "-password",
  }).lean();
};

export const blockUser = async (id: string): Promise<IUser | null> => {
  return User.findByIdAndUpdate(id, { isBlocked: true }, { new: true, select: "-password" }).lean();
};

export const unblockUser = async (id: string): Promise<IUser | null> => {
  return User.findByIdAndUpdate(id, { isBlocked: false }, { new: true, select: "-password" }).lean();
};

export const softDeleteUser = async (id: string): Promise<IUser | null> => {
  return User.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
      deletedAt: new Date(),
    },
    { new: true, select: "-password" },
  ).exec();
};

export const findUsersByRole = async (role: "admin" | "employee" | "customer"): Promise<IUser[]> => {
  return User.find({ role }).select("-password").lean();
};

export const updateUserPassword = async (id: string, hashedPassword: string): Promise<IUser | null> => {
  return User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true, select: "-password" }).lean();
};

export const emailExists = async (email: string): Promise<boolean> => {
  const user = await User.findOne({ email }).select("_id").lean();
  return !!user;
};
