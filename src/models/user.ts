import { z } from "zod";
import mongoose, { Document } from "mongoose";

// Zod schema for validation
export const UserZodSchema = z.object({
  email: z.email("Invalid email format").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "employee", "customer"], {
    error: "Role must be admin, employee, or customer",
  }),
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  isBlocked: z.boolean().default(false),
  orderCount: z.number().min(0).default(0),
  resetPasswordToken: z.string().optional(),
  resetPasswordExpires: z.date().optional(),
});

// Zod schema for creating a user (excludes auto-generated fields like _id, createdAt, updatedAt)
export const CreateUserZodSchema = UserZodSchema.omit({
  resetPasswordToken: true,
  resetPasswordExpires: true,
}).partial({
  isBlocked: true,
  orderCount: true,
});

// Zod schema for updating a user (all fields optional except for specific business rules)
export const UpdateUserZodSchema = UserZodSchema.partial();

// Zod schema for login
export const LoginUserZodSchema = z.object({
  email: z.email("Invalid email format").toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// Zod schema for password reset request
export const ResetPasswordRequestZodSchema = z.object({
  email: z.email("Invalid email format").toLowerCase(),
});

// Zod schema for password reset
export const ResetPasswordZodSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// TypeScript interfaces from Zod schemas
export type UserInput = z.infer<typeof UserZodSchema>;
export type CreateUserInput = z.infer<typeof CreateUserZodSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserZodSchema>;
export type LoginUserInput = z.infer<typeof LoginUserZodSchema>;
export type ResetPasswordRequestInput = z.infer<typeof ResetPasswordRequestZodSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordZodSchema>;

// TypeScript interface for the complete document (includes Mongoose additions)
export interface IUser extends Document {
  email: string;
  password: string;
  role: "admin" | "employee" | "customer";
  firstName: string;
  lastName: string;
  isBlocked: boolean;
  orderCount: number;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema
const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: {
        values: ["admin", "employee", "customer"],
        message: "Role must be admin, employee, or customer",
      },
      index: true,
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    orderCount: {
      type: Number,
      default: 0,
      min: [0, "Order count cannot be negative"],
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordExpires: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isBlocked: 1 });
userSchema.index({ resetPasswordToken: 1 });
userSchema.index({ resetPasswordExpires: 1 });

// Virtual for full name
userSchema.virtual("fullName").get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware
userSchema.pre("save", function (next) {
  // hash password here before saving
  // if (this.isModified('password')) {
  //   this.password = await bcrypt.hash(this.password, 10);
  // }
  next();
});

// Instance methods
userSchema.methods.isEligibleForDiscount = function (this: IUser): boolean {
  return this.orderCount > 0 && this.orderCount % 3 === 0;
};

userSchema.methods.incrementOrderCount = function (this: IUser): Promise<IUser> {
  this.orderCount += 1;
  return this.save();
};

userSchema.methods.blockUser = function (this: IUser): Promise<IUser> {
  this.isBlocked = true;
  return this.save();
};

userSchema.methods.unblockUser = function (this: IUser): Promise<IUser> {
  this.isBlocked = false;
  return this.save();
};

// Static methods
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByRole = function (role: "admin" | "employee" | "customer") {
  return this.find({ role, isBlocked: false });
};

userSchema.statics.findActiveCustomers = function () {
  return this.find({ role: "customer", isBlocked: false });
};

// Create and export the model
const User = mongoose.model<IUser>("User", userSchema);

export default User;

// Validation functions
export const validateUser = (data: unknown): UserInput => {
  return UserZodSchema.parse(data);
};

export const validateCreateUser = (data: unknown): CreateUserInput => {
  return CreateUserZodSchema.parse(data);
};

export const validateUpdateUser = (data: unknown): UpdateUserInput => {
  return UpdateUserZodSchema.parse(data);
};

export const validateLoginUser = (data: unknown): LoginUserInput => {
  return LoginUserZodSchema.parse(data);
};

export const validateResetPasswordRequest = (data: unknown): ResetPasswordRequestInput => {
  return ResetPasswordRequestZodSchema.parse(data);
};

export const validateResetPassword = (data: unknown): ResetPasswordInput => {
  return ResetPasswordZodSchema.parse(data);
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

export const safeValidateLoginUser = (data: unknown) => {
  return LoginUserZodSchema.safeParse(data);
};

export const safeValidateResetPasswordRequest = (data: unknown) => {
  return ResetPasswordRequestZodSchema.safeParse(data);
};

export const safeValidateResetPassword = (data: unknown) => {
  return ResetPasswordZodSchema.safeParse(data);
};
