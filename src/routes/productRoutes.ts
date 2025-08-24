import { Router } from "express";

import {
  createProduct,
  getProductById,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getProductsByStatus,
  getProductsByCreator,
  getMyProducts,
  getLowStockProducts,
  updateProductStock,
  bulkUpdateStocks,
  publishProduct,
  unpublishProduct,
  searchProducts,
  getProductStats,
  getAllProductsIncludingDrafts,
} from "../controllers/productController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes (no authentication required)
router.get("/search", searchProducts);
router.get("/status/:status", getProductsByStatus);

router.get("/all", authenticateToken, getAllProductsIncludingDrafts);

router.get("/:id", getProductById);
router.get("/", getAllProducts);

// Protected routes (authentication required)
router.use(authenticateToken); // All routes below require authentication

// Product management
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// Status management
router.patch("/:id/publish", publishProduct);
router.patch("/:id/unpublish", unpublishProduct);

// Stock management
router.patch("/:id/stock", updateProductStock);
router.post("/bulk-stock-update", bulkUpdateStocks);

// User-specific and admin routes
router.get("/creator/:creatorId", getProductsByCreator);
router.get("/my/products", getMyProducts);
router.get("/admin/low-stock", getLowStockProducts);
router.get("/admin/stats", getProductStats);

export default router;
