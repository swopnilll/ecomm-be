import { Router } from "express";

import { loginUser, registerUser } from "#controllers/authController.js";

const router = Router();

router.get("/", (req, res) => {
  res.send("Auth route Test Sucess");
});

// Register route
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;
