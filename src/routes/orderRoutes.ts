import { Router } from "express";

import { createOrder } from "#controllers/orderController.js";
import { authenticateToken } from "#middleware/authMiddleware.js";

const router = Router();
router.post("/", authenticateToken, createOrder);

export default router;
