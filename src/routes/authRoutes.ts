import { Router } from "express";

import { registerUser } from "#controllers/authController.js";

const router = Router();

router.get("/", (req, res) => {
  res.send("Auth route Test Sucess");
});

// Register route
router.post("/register", registerUser);

export default router;
