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
} from "../controllers/productController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes (no authentication required)
router.get("/search", searchProducts); // GET /api/products/search?q=searchterm
router.get("/status/:status", getProductsByStatus); // GET /api/products/status/published
router.get("/:id", getProductById); // GET /api/products/:id
router.get("/", getAllProducts); // GET /api/products

// Protected routes (authentication required)
router.use(authenticateToken); // All routes below require authentication

// Product management
router.post("/", createProduct); // POST /api/products
router.put("/:id", updateProduct); // PUT /api/products/:id
router.delete("/:id", deleteProduct); // DELETE /api/products/:id

// Status management
router.patch("/:id/publish", publishProduct); // PATCH /api/products/:id/publish
router.patch("/:id/unpublish", unpublishProduct); // PATCH /api/products/:id/unpublish

// Stock management
router.patch("/:id/stock", updateProductStock); // PATCH /api/products/:id/stock
router.post("/bulk-stock-update", bulkUpdateStocks); // POST /api/products/bulk-stock-update

// User-specific and admin routes
router.get("/creator/:creatorId", getProductsByCreator); // GET /api/products/creator/:creatorId
router.get("/my/products", getMyProducts); // GET /api/products/my/products
router.get("/admin/low-stock", getLowStockProducts); // GET /api/products/admin/low-stock
router.get("/admin/stats", getProductStats); // GET /api/products/admin/stats

export default router;
