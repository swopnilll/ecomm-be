import jwt from "jsonwebtoken";
import { type Request, type Response, type NextFunction } from "express";

import logger from "../utils/logger.js";

declare module "express" {
  interface Request {
    user?: { _id: string; role: string };
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  logger.info("Cookies received:", req.cookies);

  const token = req.cookies?.accessToken;

  if (!token) {
    logger.warn("Access token missing from request cookies");
    res.status(401).json({ error: "Unauthorized" }); // Changed message
    return;
  }

  try {
    logger.info("Attempting to verify access token");

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { _id: string; role: string };
    req.user = decoded;

    logger.info(`Token verified successfully for user: ${decoded._id}`);

    next();
  } catch (error) {
    logger.error("Token verification failed:", error);
    res.status(403).json({ error: "Unauthorized" });
  }
};
