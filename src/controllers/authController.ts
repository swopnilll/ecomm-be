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

    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);

    logger.info(`User logged in successfully: ${user.email}`);

    // Setting JWT token in HTTP-only cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60, // 1 minute
    });

    // Setting refreshToken in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // sanitized user data for response
    res.status(200).json({ data: sanitizeUser(user) });
  } catch (error) {
    logger.error(`Login failed for email: ${req.body.email}. Error: ${(error as Error).message}`);
    res.status(401).json({ error: (error as Error).message });
  }
};

export const logoutUser = (req: Request, res: Response): void => {
  try {
    // Clear both accessToken and refreshToken cookies
    res.cookie("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
    });

    res.cookie("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
    });

    logger.info("User logged out successfully");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Logout failed";
    logger.error(`Logout error: ${message}`);
    res.status(500).json({ error: message });
  }
};

export const refreshAccessToken = (req: Request, res: Response): void => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      logger.warn("Refresh token missing in request");
      res.status(401).json({ error: "Refresh token missing" });
      return;
    }

    const { accessToken } = authService.refreshToken(token);

    // Setting the new access token in cookie
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60, // 1 minute
    });

    logger.info("Access token refreshed successfully");
    res.status(200).json({
      message: "Access token refreshed successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Could not refresh access token";
    logger.error(`Refresh token error: ${message}`);
    res.status(403).json({ error: message });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await authService.getUserById(req.user._id);
    res.status(200).json({ data: sanitizeUser(user) });
  } catch (error) {
    logger.error(`Failed to retrieve user: ${(error as Error).message}`);
    res.status(404).json({ error: "User not found" });
  }
};
