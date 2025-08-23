import { Router } from "express";

import { authenticateToken } from "#middleware/authMiddleware.js";
import { getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser } from "#controllers/authController.js";

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

export default router;
