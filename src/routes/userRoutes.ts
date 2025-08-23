import { Router } from "express";
import * as userController from "#controllers/userController.js";
import { authenticateToken } from "#middleware/authMiddleware.js";

const router = Router();

/**
 * GET /api/v1/users/profile - Get own profile
 */
router.get("/profile", authenticateToken, userController.getOwnProfile);

/**
 * PATCH /api/v1/users/profile - Update own profile
 */
router.patch("/profile", authenticateToken, userController.updateOwnProfile);

// =================== ADMIN ONLY ENDPOINTS ===================

/**
 * GET /api/v1/users - List all users (with filtering)
 * Query params: role, isBlocked, email, searchTerm, page, limit, sortBy, sortOrder
 */
router.get("/", authenticateToken, userController.getAllUsers);

/**
 * GET /api/v1/users/:id - Get user by ID
 */
router.get("/:id", authenticateToken, userController.getUserById);

/**
 * POST /api/v1/users/employees - Register employee (admin only)
 */
router.post("/employees", authenticateToken, userController.createEmployee);

/**
 * PATCH /api/v1/users/:id/block - Block user
 */
router.patch("/:id/block", authenticateToken, userController.blockUser);

/**
 * PATCH /api/v1/users/:id/unblock - Unblock user
 */
router.patch("/:id/unblock", authenticateToken, userController.unblockUser);

/**
 * DELETE /api/v1/users/:id - Soft delete user
 */
router.delete("/:id", authenticateToken, userController.deleteUser);

export default router;
