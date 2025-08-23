import { Router } from "express";

import { authenticateToken } from "#middleware/authMiddleware.js";
import { changePassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser } from "#controllers/authController.js";

const router = Router();

router.get("/", (req, res) => {
  res.send("Auth route Test Sucess");
});

// Register route
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.post("/refresh", refreshAccessToken);

// Protected route
router.get("/me", authenticateToken, getCurrentUser);

router.post("/reset-password", authenticateToken, changePassword);

export default router;
