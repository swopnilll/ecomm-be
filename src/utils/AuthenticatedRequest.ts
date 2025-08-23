import { type Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    email?: string;
    role: "admin" | "employee" | "customer" | string;
    isBlocked?: boolean;
  };
}
