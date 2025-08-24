import { Types, mongo } from "mongoose";

import Product, {
  type IProduct,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductSearchInput,
  type BulkStockUpdatesInput,
  type IProductWithPopulatedUser,
} from "../models/products.js";
import logger from "../utils/logger.js";

interface ProductQuery {
  isDeleted: boolean;
  $text?: { $search: string };
  status?: string;
  createdBy?: string;
  basePrice?: {
    $gte?: number;
    $lte?: number;
  };
  stockAmount?: number | { $gt: number };
}

interface SortOptions {
  [key: string]: 1 | -1 | { $meta: string };
  score?: { $meta: string };
}

/**
 * Create a new product
 */
export const createProduct = async (productData: CreateProductInput): Promise<IProduct> => {
  try {
    const product = new Product(productData);
    const savedProduct = await product.save();
    logger.info(`Product created successfully with ID: ${savedProduct._id}`);
    return savedProduct;
  } catch (error) {
    logger.error("Error creating product:", error);
    throw error;
  }
};

/**
 * Find product by ID
 */
export const findProductById = async (id: string): Promise<IProductWithPopulatedUser | null> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const product = (await Product.findOne({
      _id: id,
      isDeleted: false,
    }).populate("createdBy", "firstName lastName email")) as IProductWithPopulatedUser | null;

    return product;
  } catch (error) {
    logger.error(`Error finding product by ID ${id}:`, error);
    throw error;
  }
};

/**
 * Find all products with optional filtering and pagination
 */
export const findAllProducts = async (
  searchParams: ProductSearchInput = {},
  page: number = 1,
  limit: number = 10,
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc",
): Promise<{ products: IProduct[]; total: number; page: number; totalPages: number }> => {
  try {
    const query: ProductQuery = { isDeleted: false };

    // Apply search filters
    if (searchParams.name) {
      query.$text = { $search: searchParams.name };
    }

    if (searchParams.status) {
      query.status = searchParams.status;
    }

    if (searchParams.createdBy) {
      query.createdBy = searchParams.createdBy;
    }

    if (searchParams.minPrice !== undefined || searchParams.maxPrice !== undefined) {
      query.basePrice = {};
      if (searchParams.minPrice !== undefined) {
        query.basePrice.$gte = searchParams.minPrice;
      }
      if (searchParams.maxPrice !== undefined) {
        query.basePrice.$lte = searchParams.maxPrice;
      }
    }

    if (searchParams.inStock !== undefined) {
      if (searchParams.inStock) {
        query.stockAmount = { $gt: 0 };
      } else {
        query.stockAmount = 0;
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions: SortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Add text search score sorting if searching by name
    if (searchParams.name) {
      sortOptions.score = { $meta: "textScore" };
    }

    const [products, total] = await Promise.all([
      Product.find(query).populate("createdBy", "firstName lastName email").sort(sortOptions).skip(skip).limit(limit).lean(),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      products: products as IProduct[],
      total,
      page,
      totalPages,
    };
  } catch (error) {
    logger.error("Error finding products:", error);
    throw error;
  }
};

/**
 * Update product by ID
 */
export const updateProductById = async (id: string, updateData: UpdateProductInput): Promise<IProduct | null> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true, runValidators: true },
    ).populate("createdBy", "firstName lastName email");

    if (updatedProduct) {
      logger.info(`Product updated successfully with ID: ${updatedProduct._id}`);
    }

    return updatedProduct;
  } catch (error) {
    logger.error(`Error updating product by ID ${id}:`, error);
    throw error;
  }
};

/**
 * Soft delete product by ID
 */
export const deleteProductById = async (id: string): Promise<IProduct | null> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const deletedProduct = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      },
      { new: true },
    );

    if (deletedProduct) {
      logger.info(`Product soft deleted successfully with ID: ${deletedProduct._id}`);
    }

    return deletedProduct;
  } catch (error) {
    logger.error(`Error deleting product by ID ${id}:`, error);
    throw error;
  }
};

/**
 * Find products by status
 */
export const findProductsByStatus = async (status: "draft" | "published"): Promise<IProduct[]> => {
  try {
    const products = await Product.find({
      status,
      isDeleted: false,
    }).populate("createdBy", "firstName lastName email");

    return products;
  } catch (error) {
    logger.error(`Error finding products by status ${status}:`, error);
    throw error;
  }
};

/**
 * Find products by creator
 */
export const findProductsByCreator = async (createdBy: string): Promise<IProduct[]> => {
  try {
    if (!Types.ObjectId.isValid(createdBy)) {
      return [];
    }

    const products = await Product.find({
      createdBy,
      isDeleted: false,
    }).populate("createdBy", "firstName lastName email");

    return products;
  } catch (error) {
    logger.error(`Error finding products by creator ${createdBy}:`, error);
    throw error;
  }
};

/**
 * Find products with low stock
 */
export const findLowStockProducts = async (threshold: number = 5): Promise<IProduct[]> => {
  try {
    const products = await Product.find({
      stockAmount: { $lte: threshold },
      status: "published",
      isDeleted: false,
    }).populate("createdBy", "firstName lastName email");

    return products;
  } catch (error) {
    logger.error(`Error finding low stock products:`, error);
    throw error;
  }
};

/**
 * Update stock for a single product
 */
export const updateProductStock = async (id: string, stockAmount: number): Promise<IProduct | null> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { stockAmount: Math.max(0, Math.floor(stockAmount)) } },
      { new: true, runValidators: true },
    ).populate("createdBy", "firstName lastName email");

    if (updatedProduct) {
      logger.info(`Product stock updated successfully for ID: ${updatedProduct._id}`);
    }

    return updatedProduct;
  } catch (error) {
    logger.error(`Error updating product stock for ID ${id}:`, error);
    throw error;
  }
};

/**
 * Bulk update product stocks
 */
export const bulkUpdateProductStocks = async (updates: BulkStockUpdatesInput): Promise<mongo.BulkWriteResult> => {
  try {
    const operations = updates.map((update) => ({
      updateOne: {
        filter: { _id: update.productId, isDeleted: false },
        update: { $set: { stockAmount: Math.max(0, Math.floor(update.stockAmount)) } },
      },
    }));

    const result = await Product.bulkWrite(operations);
    logger.info(`Bulk stock update completed: ${result.modifiedCount} products updated`);

    return result;
  } catch (error) {
    logger.error("Error bulk updating product stocks:", error);
    throw error;
  }
};

/**
 * Publish product
 */
export const publishProduct = async (id: string): Promise<IProduct | null> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const publishedProduct = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { status: "published" } },
      { new: true, runValidators: true },
    ).populate("createdBy", "firstName lastName email");

    if (publishedProduct) {
      logger.info(`Product published successfully with ID: ${publishedProduct._id}`);
    }

    return publishedProduct;
  } catch (error) {
    logger.error(`Error publishing product by ID ${id}:`, error);
    throw error;
  }
};

/**
 * Unpublish product
 */
export const unpublishProduct = async (id: string): Promise<IProduct | null> => {
  try {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const unpublishedProduct = await Product.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { status: "draft" } },
      { new: true, runValidators: true },
    ).populate("createdBy", "firstName lastName email");

    if (unpublishedProduct) {
      logger.info(`Product unpublished successfully with ID: ${unpublishedProduct._id}`);
    }

    return unpublishedProduct;
  } catch (error) {
    logger.error(`Error unpublishing product by ID ${id}:`, error);
    throw error;
  }
};

/**
 * Search products by name
 */
export const searchProductsByName = async (searchTerm: string): Promise<IProduct[]> => {
  try {
    // const products = await Product.find({
    //   $text: { $search: searchTerm },
    //   isDeleted: false,
    // })
    //   .populate("createdBy", "firstName lastName email")
    //   .sort({ score: { $meta: "textScore" } });

    const searchRegex = new RegExp(searchTerm, "i");

    const products = await Product.find({
      name: { $regex: searchRegex },
      isDeleted: false,
    })
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    return products;
  } catch (error) {
    logger.error(`Error searching products by name "${searchTerm}":`, error);
    throw error;
  }
};

/**
 * Get product statistics
 */
export const getProductStats = async () => {
  try {
    const stats = await Product.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          publishedProducts: {
            $sum: { $cond: [{ $eq: ["$status", "published"] }, 1, 0] },
          },
          draftProducts: {
            $sum: { $cond: [{ $eq: ["$status", "draft"] }, 1, 0] },
          },
          totalStockValue: {
            $sum: { $multiply: ["$basePrice", "$stockAmount"] },
          },
          averagePrice: { $avg: "$basePrice" },
          totalStock: { $sum: "$stockAmount" },
          lowStockProducts: {
            $sum: { $cond: [{ $lte: ["$stockAmount", 5] }, 1, 0] },
          },
        },
      },
    ]);

    return (
      stats[0] || {
        totalProducts: 0,
        publishedProducts: 0,
        draftProducts: 0,
        totalStockValue: 0,
        averagePrice: 0,
        totalStock: 0,
        lowStockProducts: 0,
      }
    );
  } catch (error) {
    logger.error("Error getting product statistics:", error);
    throw error;
  }
};
