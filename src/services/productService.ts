import Product, {
  type IProduct,
  validateCreateProduct,
  validateUpdateProduct,
  validateProductSearch,
  validateBulkStockUpdates,
  type IProductWithPopulatedUser,
} from "../models/products.js";
import {
  createProduct,
  findProductById,
  findAllProducts,
  updateProductById,
  deleteProductById,
  findProductsByStatus,
  findProductsByCreator,
  findLowStockProducts,
  updateProductStock,
  bulkUpdateProductStocks,
  publishProduct,
  unpublishProduct,
  searchProductsByName,
  getProductStats,
} from "../repositories/productRepository.js";
import { ProductNotFoundError, ProductAlreadyExistsError, InvalidProductStatusError, ValidationError, UnauthorizedError } from "../utils/errors.js";
import { mongo } from "mongoose";
import logger from "../utils/logger.js";

interface ProductStats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  totalStockValue: number;
  averagePrice: number;
  totalStock: number;
  lowStockProducts: number;
}

/**
 * Create a new product
 */
export const createProductService = async (productData: unknown, createdById: string): Promise<IProduct> => {
  try {
    // Validate input data
    const validatedData = validateCreateProduct(productData);

    // Add the creator ID
    const productWithCreator = {
      ...validatedData,
      createdBy: createdById,
    };

    // Check if product with same name already exists (optional business rule)
    const existingProduct = await Product.findOne({
      name: productWithCreator.name,
      isDeleted: false,
    });

    if (existingProduct) {
      throw new ProductAlreadyExistsError(`Product with name "${productWithCreator.name}" already exists`);
    }

    const product = await createProduct(productWithCreator);
    logger.info(`Product created successfully by user ${createdById}`);

    return product;
  } catch (error) {
    logger.error("Error in createProductService:", error);
    throw error;
  }
};

/**
 * Get product by ID
 */
export const getProductByIdService = async (id: string): Promise<IProductWithPopulatedUser> => {
  try {
    const product = await findProductById(id);

    if (!product) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    return product;
  } catch (error) {
    logger.error(`Error in getProductByIdService for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get all products with filtering and pagination
 */
export const getAllProductsService = async (
  searchParams: unknown = {},
  page: number = 1,
  limit: number = 10,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<{ products: IProduct[]; total: number; page: number; totalPages: number }> => {
  try {
    // Validate search parameters
    const validatedSearchParams = validateProductSearch(searchParams);

    // Ensure pagination parameters are valid
    const validPage = Math.max(1, page);
    const validLimit = Math.min(Math.max(1, limit), 100); // Max 100 items per page

    const result = await findAllProducts(validatedSearchParams, validPage, validLimit, sortBy, sortOrder);

    return result;
  } catch (error) {
    logger.error("Error in getAllProductsService:", error);
    throw error;
  }
};

/**
 * Update product by ID
 */
export const updateProductService = async (id: string, updateData: unknown, userId: string, userRole: string): Promise<IProduct> => {
  try {
    // Validate input data
    const validatedData = validateUpdateProduct(updateData);

    // Check if product exists
    const existingProduct = await findProductById(id);
    if (!existingProduct) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    // Check permissions - only admin or the creator can update
    if (userRole !== "admin" && existingProduct.createdBy._id.toString() !== userId) {
      throw new UnauthorizedError("You don't have permission to update this product");
    }

    const updatedProduct = await updateProductById(id, validatedData);

    if (!updatedProduct) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    logger.info(`Product ${id} updated successfully by user ${userId}`);
    return updatedProduct;
  } catch (error) {
    logger.error(`Error in updateProductService for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete product by ID
 */
export const deleteProductService = async (id: string, userId: string, userRole: string): Promise<IProduct> => {
  try {
    // Check if product exists
    const existingProduct = await findProductById(id);
    if (!existingProduct) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    // Check permissions - only admin or the creator can delete
    if (userRole !== "admin" && existingProduct.createdBy._id.toString() !== userId) {
      throw new UnauthorizedError("You don't have permission to delete this product");
    }

    const deletedProduct = await deleteProductById(id);

    if (!deletedProduct) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    logger.info(`Product ${id} deleted successfully by user ${userId}`);
    return deletedProduct;
  } catch (error) {
    logger.error(`Error in deleteProductService for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get products by status
 */
export const getProductsByStatusService = async (status: "draft" | "published"): Promise<IProduct[]> => {
  try {
    if (!["draft", "published"].includes(status)) {
      throw new InvalidProductStatusError(`Invalid status: ${status}`);
    }

    const products = await findProductsByStatus(status);
    return products;
  } catch (error) {
    logger.error(`Error in getProductsByStatusService for status ${status}:`, error);
    throw error;
  }
};

/**
 * Get products by creator
 */
export const getProductsByCreatorService = async (createdBy: string): Promise<IProduct[]> => {
  try {
    const products = await findProductsByCreator(createdBy);
    return products;
  } catch (error) {
    logger.error(`Error in getProductsByCreatorService for creator ${createdBy}:`, error);
    throw error;
  }
};

/**
 * Get low stock products
 */
export const getLowStockProductsService = async (threshold: number = 5): Promise<IProduct[]> => {
  try {
    if (threshold < 0) {
      throw new ValidationError("Threshold must be non-negative");
    }

    const products = await findLowStockProducts(threshold);
    return products;
  } catch (error) {
    logger.error("Error in getLowStockProductsService:", error);
    throw error;
  }
};

/**
 * Update product stock
 */
export const updateProductStockService = async (id: string, stockAmount: number, userId: string, userRole: string): Promise<IProduct> => {
  try {
    if (stockAmount < 0) {
      throw new ValidationError("Stock amount must be non-negative");
    }

    // Check if product exists
    const existingProduct = await findProductById(id);
    if (!existingProduct) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    // Check permissions - only admin or employee can update stock
    if (!["admin", "employee"].includes(userRole)) {
      throw new UnauthorizedError("You don't have permission to update product stock");
    }

    const updatedProduct = await updateProductStock(id, stockAmount);

    if (!updatedProduct) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    logger.info(`Product stock updated for ${id} by user ${userId}`);
    return updatedProduct;
  } catch (error) {
    logger.error(`Error in updateProductStockService for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Bulk update product stocks
 */
export const bulkUpdateStocksService = async (updates: unknown, userId: string, userRole: string): Promise<mongo.BulkWriteResult> => {
  try {
    // Check permissions - only admin or employee can bulk update stocks
    if (!["admin", "employee"].includes(userRole)) {
      throw new UnauthorizedError("You don't have permission to bulk update product stocks");
    }

    // Validate input data
    const validatedUpdates = validateBulkStockUpdates(updates);

    const result = await bulkUpdateProductStocks(validatedUpdates);

    logger.info(`Bulk stock update completed by user ${userId}: ${result.modifiedCount} products updated`);
    return result;
  } catch (error) {
    logger.error("Error in bulkUpdateStocksService:", error);
    throw error;
  }
};

/**
 * Publish product
 */
export const publishProductService = async (id: string, userId: string, userRole: string): Promise<IProduct> => {
  try {
    // Check if product exists
    const existingProduct = await findProductById(id);
    if (!existingProduct) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    // Fix: Log the product ID instead of the entire object
    logger.info(`Publishing product with ID: ${id}`);
    logger.info(`User ID: ${userId}`);

    // Check permissions - only admin or the creator can publish
    // Now TypeScript knows createdBy is a populated user object
    if (userRole !== "admin" && existingProduct.createdBy._id.toString() !== userId) {
      throw new UnauthorizedError("You don't have permission to publish this product");
    }

    // Check if product is already published
    if (existingProduct.status === "published") {
      throw new InvalidProductStatusError("Product is already published");
    }

    const publishedProduct = await publishProduct(id);

    if (!publishedProduct) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    logger.info(`Product ${id} published successfully by user ${userId}`);
    return publishedProduct;
  } catch (error) {
    logger.error(`Error in publishProductService for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Unpublish product
 */
export const unpublishProductService = async (id: string, userId: string, userRole: string): Promise<IProduct> => {
  try {
    // Check if product exists
    const existingProduct = await findProductById(id);
    if (!existingProduct) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    // Check permissions - only admin or the creator can unpublish
    if (userRole !== "admin" && existingProduct.createdBy._id.toString() !== userId) {
      throw new UnauthorizedError("You don't have permission to unpublish this product");
    }

    // Check if product is already draft
    if (existingProduct.status === "draft") {
      throw new InvalidProductStatusError("Product is already in draft status");
    }

    const unpublishedProduct = await unpublishProduct(id);

    if (!unpublishedProduct) {
      throw new ProductNotFoundError(`Product with ID ${id} not found`);
    }

    logger.info(`Product ${id} unpublished successfully by user ${userId}`);
    return unpublishedProduct;
  } catch (error) {
    logger.error(`Error in unpublishProductService for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Search products by name
 */
export const searchProductsService = async (searchTerm: string): Promise<IProduct[]> => {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new ValidationError("Search term is required");
    }

    const products = await searchProductsByName(searchTerm.trim());
    return products;
  } catch (error) {
    logger.error(`Error in searchProductsService for term "${searchTerm}":`, error);
    throw error;
  }
};

/**
 * Get product statistics
 */
export const getProductStatsService = async (userRole: string): Promise<ProductStats> => {
  try {
    // Check permissions - only admin and employee can view stats
    if (!["admin", "employee"].includes(userRole)) {
      throw new UnauthorizedError("You don't have permission to view product statistics");
    }

    const stats = await getProductStats();
    return stats;
  } catch (error) {
    logger.error("Error in getProductStatsService:", error);
    throw error;
  }
};
