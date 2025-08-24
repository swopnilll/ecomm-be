import logger from "#utils/logger.js";
import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user: {
    _id: string;
    role: string;
  };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  logger.info("Cookies received:", req.cookies);

  const token = req.cookies?.accessToken;

  if (!token) {
    logger.warn("Access token missing from request cookies");
    res.status(401).json({
      success: false,
      error: "Unauthorized - No token provided",
    });
    return;
  }

  try {
    logger.info("Attempting to verify access token");

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      _id: string;
      role: string;
    };

    // Cast req to AuthenticatedRequest to assign user
    (req as AuthenticatedRequest).user = {
      _id: decoded._id,
      role: decoded.role,
    };

    logger.info(`Token verified successfully for user: ${decoded._id}`);

    next();
  } catch (error) {
    logger.error("Token verification failed:", error);
    res.status(403).json({
      success: false,
      error: "Unauthorized - Invalid token",
    });
  }
};

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      logger.warn("Authorization attempted without authentication");
      res.status(401).json({
        success: false,
        error: "Unauthorized - No user information",
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`User ${req.user._id} with role ${req.user.role} attempted to access resource requiring roles: ${allowedRoles.join(", ")}`);
      res.status(403).json({
        success: false,
        error: "Forbidden - Insufficient permissions",
      });
      return;
    }

    logger.info(`User ${req.user._id} authorized with role ${req.user.role}`);
    next();
  };
};
