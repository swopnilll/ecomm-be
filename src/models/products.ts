import { z } from "zod";
import mongoose, { Document, type ObjectId } from "mongoose";

// Zod schema for validation
export const ProductZodSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  description: z.string().min(1, "Product description is required").trim(),
  images: z.array(z.string().url("Invalid image URL")).default([]),
  basePrice: z.number().min(0, "Base price must be non-negative"),
  taxRate: z.number().min(0, "Tax rate must be non-negative").max(100, "Tax rate cannot exceed 100%").default(0),
  status: z
    .enum(["draft", "published"], {
      error: "Status must be either draft or published",
    })
    .default("draft"),
  stockAmount: z.number().int("Stock amount must be an integer").min(0, "Stock amount must be non-negative").default(0),
  createdBy: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
});

// Zod schema for creating a product (excludes auto-generated fields)
export const CreateProductZodSchema = ProductZodSchema.partial({
  images: true,
  taxRate: true,
  status: true,
  stockAmount: true,
});

// Zod schema for updating a product (all fields optional)
export const UpdateProductZodSchema = ProductZodSchema.partial();

// Zod schema for product search/filtering
export const ProductSearchZodSchema = z
  .object({
    name: z.string().optional(),
    status: z.enum(["draft", "published"]).optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().min(0).optional(),
    createdBy: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format")
      .optional(),
    inStock: z.boolean().optional(),
  })
  .partial();

// Zod schema for bulk stock update
export const BulkStockUpdateZodSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId format"),
  stockAmount: z.number().int("Stock amount must be an integer").min(0, "Stock amount must be non-negative"),
});

export const BulkStockUpdatesZodSchema = z.array(BulkStockUpdateZodSchema);

// TypeScript interfaces from Zod schemas
export type ProductInput = z.infer<typeof ProductZodSchema>;
export type CreateProductInput = z.infer<typeof CreateProductZodSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductZodSchema>;
export type ProductSearchInput = z.infer<typeof ProductSearchZodSchema>;
export type BulkStockUpdateInput = z.infer<typeof BulkStockUpdateZodSchema>;
export type BulkStockUpdatesInput = z.infer<typeof BulkStockUpdatesZodSchema>;

// TypeScript interface for the complete document (includes Mongoose additions)
export interface IProduct extends Document {
  name: string;
  description: string;
  images: string[];
  basePrice: number;
  taxRate: number;
  status: "draft" | "published";
  stockAmount: number;
  createdBy: ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Virtual properties
  finalPrice: number;
  isInStock: boolean;

  // Instance methods
  calculateFinalPrice(): number;
  updateStock(amount: number): Promise<IProduct>;
  addStock(amount: number): Promise<IProduct>;
  removeStock(amount: number): Promise<IProduct>;
  publish(): Promise<IProduct>;
  unpublish(): Promise<IProduct>;
  addImage(imageUrl: string): Promise<IProduct>;
  removeImage(imageUrl: string): Promise<IProduct>;
}

// Mongoose schema
const productSchema = new mongoose.Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function (images: string[]) {
          return images.every((img) => {
            const urlRegex = /^https?:\/\/.+/;
            return urlRegex.test(img);
          });
        },
        message: "All images must be valid URLs",
      },
    },
    basePrice: {
      type: Number,
      required: [true, "Base price is required"],
      min: [0, "Base price must be non-negative"],
      index: true,
    },
    taxRate: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Tax rate must be non-negative"],
      max: [100, "Tax rate cannot exceed 100%"],
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["draft", "published"],
        message: "Status must be either draft or published",
      },
      default: "draft",
      index: true,
    },
    stockAmount: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock amount must be non-negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock amount must be an integer",
      },
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Indexes for performance
productSchema.index({ name: 1 });
productSchema.index({ status: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ stockAmount: 1 });
productSchema.index({ createdBy: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: "text", description: "text" }); // Text search index

// Compound indexes
productSchema.index({ status: 1, stockAmount: 1 });
productSchema.index({ createdBy: 1, status: 1 });

// Virtual for final price (including tax)
productSchema.virtual("finalPrice").get(function (this: IProduct) {
  return this.basePrice * (1 + this.taxRate / 100);
});

// Virtual for stock status
productSchema.virtual("isInStock").get(function (this: IProduct) {
  return this.stockAmount > 0;
});

// Pre-save middleware
productSchema.pre("save", function (next) {
  // Ensure tax rate is within valid range
  if (this.taxRate < 0) this.taxRate = 0;
  if (this.taxRate > 100) this.taxRate = 100;

  // Ensure stock amount is integer
  this.stockAmount = Math.floor(Math.max(0, this.stockAmount));

  next();
});

// Instance methods
productSchema.methods.calculateFinalPrice = function (this: IProduct): number {
  return this.basePrice * (1 + this.taxRate / 100);
};

productSchema.methods.updateStock = function (this: IProduct, amount: number): Promise<IProduct> {
  this.stockAmount = Math.max(0, Math.floor(amount));
  return this.save();
};

productSchema.methods.addStock = function (this: IProduct, amount: number): Promise<IProduct> {
  this.stockAmount += Math.floor(Math.max(0, amount));
  return this.save();
};

productSchema.methods.removeStock = function (this: IProduct, amount: number): Promise<IProduct> {
  this.stockAmount = Math.max(0, this.stockAmount - Math.floor(Math.max(0, amount)));
  return this.save();
};

productSchema.methods.publish = function (this: IProduct): Promise<IProduct> {
  this.status = "published";
  return this.save();
};

productSchema.methods.unpublish = function (this: IProduct): Promise<IProduct> {
  this.status = "draft";
  return this.save();
};

productSchema.methods.addImage = function (this: IProduct, imageUrl: string): Promise<IProduct> {
  if (!this.images.includes(imageUrl)) {
    this.images.push(imageUrl);
  }
  return this.save();
};

productSchema.methods.removeImage = function (this: IProduct, imageUrl: string): Promise<IProduct> {
  this.images = this.images.filter((img) => img !== imageUrl);
  return this.save();
};

// Static methods
productSchema.statics.findByStatus = function (status: "draft" | "published") {
  return this.find({ status, isDeleted: false });
};

productSchema.statics.findPublished = function () {
  return this.find({ status: "published", isDeleted: false });
};

productSchema.statics.findInStock = function () {
  return this.find({ stockAmount: { $gt: 0 }, isDeleted: false });
};

productSchema.statics.findByCreator = function (createdBy: string | ObjectId) {
  return this.find({ createdBy, isDeleted: false });
};

productSchema.statics.findByPriceRange = function (minPrice: number, maxPrice: number) {
  return this.find({
    basePrice: { $gte: minPrice, $lte: maxPrice },
    isDeleted: false,
  });
};

productSchema.statics.searchByName = function (searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm },
    isDeleted: false,
  }).sort({ score: { $meta: "textScore" } });
};

productSchema.statics.findLowStock = function (threshold: number = 5) {
  return this.find({
    stockAmount: { $lte: threshold },
    status: "published",
    isDeleted: false,
  });
};

productSchema.statics.bulkUpdateStock = function (updates: BulkStockUpdatesInput) {
  const operations = updates.map((update) => ({
    updateOne: {
      filter: { _id: update.productId, isDeleted: false },
      update: { $set: { stockAmount: update.stockAmount } },
    },
  }));

  return this.bulkWrite(operations);
};

// Create and export the model
const Product = mongoose.model<IProduct>("Product", productSchema);

export default Product;

// Validation functions
export const validateProduct = (data: unknown): ProductInput => {
  return ProductZodSchema.parse(data);
};

export const validateCreateProduct = (data: unknown): CreateProductInput => {
  return CreateProductZodSchema.parse(data);
};

export const validateUpdateProduct = (data: unknown): UpdateProductInput => {
  return UpdateProductZodSchema.parse(data);
};

export const validateProductSearch = (data: unknown): ProductSearchInput => {
  return ProductSearchZodSchema.parse(data);
};

export const validateBulkStockUpdate = (data: unknown): BulkStockUpdateInput => {
  return BulkStockUpdateZodSchema.parse(data);
};

export const validateBulkStockUpdates = (data: unknown): BulkStockUpdatesInput => {
  return BulkStockUpdatesZodSchema.parse(data);
};

// Safe validation functions that return result objects instead of throwing
export const safeValidateProduct = (data: unknown) => {
  return ProductZodSchema.safeParse(data);
};

export const safeValidateCreateProduct = (data: unknown) => {
  return CreateProductZodSchema.safeParse(data);
};

export const safeValidateUpdateProduct = (data: unknown) => {
  return UpdateProductZodSchema.safeParse(data);
};

export const safeValidateProductSearch = (data: unknown) => {
  return ProductSearchZodSchema.safeParse(data);
};

export const safeValidateBulkStockUpdate = (data: unknown) => {
  return BulkStockUpdateZodSchema.safeParse(data);
};

export const safeValidateBulkStockUpdates = (data: unknown) => {
  return BulkStockUpdatesZodSchema.safeParse(data);
};

// Type for populated user
export interface IPopulatedUser {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
}

// Type for product with populated createdBy
export interface IProductWithPopulatedUser extends Omit<IProduct, "createdBy"> {
  createdBy: IPopulatedUser;
}
