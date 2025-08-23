import { type Request, type Response } from "express";

import logger from "../utils/logger.js";
import type { IUser } from "#models/user.js";
import * as authService from "../services/authService.js";

// Utility to sanitize user object for client responses
const sanitizeUser = (user: IUser) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.resetPasswordToken;
  delete userObj.resetPasswordExpires;
  return userObj;
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    logger.info(`Register attempt for email: ${req.body.email}`);

    const user = await authService.registerUser(req.body);

    logger.info(`User registered successfully: ${user.email}`);

    res.status(201).json({ data: sanitizeUser(user) });
  } catch (error) {
    logger.error(`Registration failed for email: ${req.body.email}. Error: ${(error as Error).message}`);
    res.status(400).json({ error: (error as Error).message });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    logger.info(`Login attempt for email: ${req.body.email}`);

    const { user, token } = await authService.loginUser(req.body);

    logger.info(`User logged in successfully: ${user.email}`);

    // Setting JWT token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only sending cookie over HTTPS in prod
      sameSite: "strict",
      maxAge: 1000 * 60 * 60, // 1 hour
    });

    // sanitized user data for response
    res.status(200).json({ data: sanitizeUser(user) });
  } catch (error) {
    logger.error(`Login failed for email: ${req.body.email}. Error: ${(error as Error).message}`);
    res.status(401).json({ error: (error as Error).message });
  }
};
