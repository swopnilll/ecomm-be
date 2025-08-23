import { type Request, type Response } from "express";
import { asyncHandler } from "#utils/apiResponse.js";
import { handleServiceError } from "#utils/errors.js";

import * as userService from "#services/userService.js";
import logger from "#utils/logger.js";
import type { UserFilters } from "#repositories/userRepository.js";

interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    id?: string;
    email?: string;
    role: "admin" | "employee" | "customer" | string;
    isBlocked?: boolean;
  };
}

/**
 * GET /api/v1/users - List all users (with filtering)
 */
export const getAllUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate admin permissions
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    // Extract query parameters
    const { role, isBlocked, email, searchTerm, page = "1", limit = "10", sortBy = "createdAt", sortOrder = "desc" } = req.query;

    // Prepare filters
    const filters: UserFilters = {};

    if (role && ["admin", "employee", "customer"].includes(role as string)) {
      filters.role = role as "admin" | "employee" | "customer";
    }

    if (isBlocked !== undefined) {
      filters.isBlocked = isBlocked === "true";
    }

    if (email) {
      filters.email = email as string;
    }

    if (searchTerm) {
      filters.searchTerm = searchTerm as string;
    }

    // Prepare pagination options
    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    };

    const result = await userService.getAllUsers(filters, options);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
});

/**
 * GET /api/v1/users/:id - Get user by ID
 */
export const getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate admin permissions
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const user = await userService.getUserById(id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
});

/**
 * POST /api/v1/users/employees - Register employee (admin only)
 */
export const createEmployee = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate admin permissions
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const user = await userService.createEmployee(req.body);

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: user,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
});

/**
 * PATCH /api/v1/users/:id/block - Block user
 */
export const blockUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate admin permissions
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const user = await userService.blockUserById(id);

    res.json({
      success: true,
      message: "User blocked successfully",
      data: user,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
});

/**
 * PATCH /api/v1/users/:id/unblock - Unblock user
 */
export const unblockUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate admin permissions
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const user = await userService.unblockUserById(id);

    res.json({
      success: true,
      message: "User unblocked successfully",
      data: user,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
});

/**
 * DELETE /api/v1/users/:id - Soft delete user
 */
export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate admin permissions
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const user = await userService.deleteUserById(id);

    res.json({
      success: true,
      message: "User deleted successfully",
      data: user,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
});

/**
 * GET /api/v1/users/profile - Get own profile
 */
export const getOwnProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    logger.info("Fetching own profile", { userId: req.user?._id });

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    logger.info("User is auth");

    logger.info(req.user);

    const user = await userService.getOwnProfile(req.user._id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
});

/**
 * PATCH /api/v1/users/profile - Update own profile
 */
export const updateOwnProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await userService.updateOwnProfile(req.user._id, req.body);

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
});
