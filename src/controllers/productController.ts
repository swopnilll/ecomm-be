import { type Request, type Response } from "express";
import {
  createProductService,
  getProductByIdService,
  getAllProductsService,
  updateProductService,
  deleteProductService,
  getProductsByStatusService,
  getProductsByCreatorService,
  getLowStockProductsService,
  updateProductStockService,
  bulkUpdateStocksService,
  publishProductService,
  unpublishProductService,
  searchProductsService,
  getProductStatsService,
} from "../services/productService.js";
import { handleServiceError } from "../utils/errors.js";
import { type AuthenticatedRequest } from "../utils/AuthenticatedRequest.js";

/**
 * Create a new product
 */
export const createProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Only admin and employee can create products
    if (!["admin", "employee"].includes(userRole || "")) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to create products",
      });
      return;
    }

    const product = await createProductService(req.body, userId);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Get product by ID
 */
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const product = await getProductByIdService(id);

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully",
      data: product,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Get all products with filtering and pagination
 */
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "desc", ...searchParams } = req.query;

    const result = await getAllProductsService(searchParams, Number(page), Number(limit), sortBy as string, sortOrder as "asc" | "desc");

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: result.products,
      pagination: {
        page: result.page,
        limit: Number(limit),
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Update product by ID
 */
export const updateProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const updatedProduct = await updateProductService(id, req.body, userId, userRole || "");

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Delete product by ID
 */
export const deleteProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const deletedProduct = await deleteProductService(id, userId, userRole || "");

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
      data: deletedProduct,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Get products by status
 */
export const getProductsByStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.params;

    const products = await getProductsByStatusService(status as "draft" | "published");

    res.status(200).json({
      success: true,
      message: `${status} products retrieved successfully`,
      data: products,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Get products by creator
 */
export const getProductsByCreator = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { creatorId } = req.params;
    const userRole = req.user?.role;
    const userId = req.user?._id;

    // Only admin can view other users' products, others can only view their own
    if (userRole !== "admin" && userId !== creatorId) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to view other users' products",
      });
      return;
    }

    if (!creatorId || typeof creatorId !== "string") {
      res.status(400).json({
        success: false,
        message: "Creator ID is required",
      });
      return;
    }

    const products = await getProductsByCreatorService(creatorId);

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Get my products (current user's products)
 */
export const getMyProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const products = await getProductsByCreatorService(userId);

    res.status(200).json({
      success: true,
      message: "Your products retrieved successfully",
      data: products,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;

    // Only admin and employee can view low stock products
    if (!["admin", "employee"].includes(userRole || "")) {
      res.status(403).json({
        success: false,
        message: "You don't have permission to view low stock products",
      });
      return;
    }

    const { threshold = 5 } = req.query;
    const products = await getLowStockProductsService(Number(threshold));

    res.status(200).json({
      success: true,
      message: "Low stock products retrieved successfully",
      data: products,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Update product stock
 */
export const updateProductStock = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { stockAmount } = req.body;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const updatedProduct = await updateProductStockService(id, stockAmount, userId, userRole || "");

    res.status(200).json({
      success: true,
      message: "Product stock updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Bulk update product stocks
 */
export const bulkUpdateStocks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await bulkUpdateStocksService(req.body, userId, userRole || "");

    res.status(200).json({
      success: true,
      message: "Bulk stock update completed successfully",
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount,
      },
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Publish product
 */
export const publishProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }
    const publishedProduct = await publishProductService(id, userId, userRole || "");

    res.status(200).json({
      success: true,
      message: "Product published successfully",
      data: publishedProduct,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Unpublish product
 */
export const unpublishProduct = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!id || typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
      return;
    }

    const unpublishedProduct = await unpublishProductService(id, userId, userRole || "");

    res.status(200).json({
      success: true,
      message: "Product unpublished successfully",
      data: unpublishedProduct,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Search products by name
 */
export const searchProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      res.status(400).json({
        success: false,
        message: "Search query parameter 'q' is required",
      });
      return;
    }

    const products = await searchProductsService(q);

    res.status(200).json({
      success: true,
      message: "Search completed successfully",
      data: products,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};

/**
 * Get product statistics
 */
export const getProductStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userRole = req.user?.role;

    if (!userRole) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const stats = await getProductStatsService(userRole);

    res.status(200).json({
      success: true,
      message: "Product statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};
