import { z } from "zod";
import mongoose, { Document, Types } from "mongoose";

// Zod schema for order items
export const OrderItemZodSchema = z.object({
  productId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid product ID",
  }),
  productName: z.string().min(1, "Product name is required").trim(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  taxRate: z.number().min(0).max(1, "Tax rate must be between 0 and 1"),
  subtotal: z.number().min(0, "Subtotal cannot be negative"),
});

// Zod schema for order items input (subtotal will be calculated)
export const OrderItemInputZodSchema = z.object({
  productId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid product ID",
  }),
  productName: z.string().min(1, "Product name is required").trim(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price cannot be negative"),
  taxRate: z.number().min(0).max(1, "Tax rate must be between 0 and 1"),
});

// Zod schema for creating an order (excludes auto-generated and auto-calculated fields)
export const CreateOrderZodSchema = z.object({
  customerId: z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid customer ID",
  }),
  items: z.array(OrderItemInputZodSchema).min(1, "At least one item is required"),
  discountAmount: z.number().min(0, "Discount amount cannot be negative").default(0).optional(),
  status: z
    .enum(["registered", "paid", "delivered"], {
      message: "Status must be registered, paid, or delivered",
    })
    .default("registered")
    .optional(),
  paymentMethod: z.string().default("invoice").optional(),
});

// Type exports
export type CreateOrderInputType = z.infer<typeof CreateOrderZodSchema>;
export type OrderItemInputType = z.infer<typeof OrderItemInputZodSchema>;

// TypeScript interface for order items in MongoDB
export interface IOrderItem {
  productId: Types.ObjectId;
  productName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  subtotal: number;
}

// TypeScript interface for the complete order document
export interface IOrder extends Document {
  orderNumber: string;
  customerId: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: "registered" | "paid" | "delivered";
  paymentMethod: string;
  registeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to generate unique order number
const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

// Mongoose schema for order items
const orderItemSchema = new mongoose.Schema<IOrderItem>(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
      index: true,
    },
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
    taxRate: {
      type: Number,
      required: [true, "Tax rate is required"],
      min: [0, "Tax rate cannot be negative"],
      max: [1, "Tax rate cannot exceed 100%"],
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
  },
  { _id: false },
);

// Mongoose schema for orders
const orderSchema = new mongoose.Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: [true, "Order number is required"],
      unique: true,
      trim: true,
      index: true,
      default: generateOrderNumber,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: [true, "Items are required"],
      validate: {
        validator: function (items: IOrderItem[]) {
          return items && items.length > 0;
        },
        message: "At least one item is required",
      },
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    taxAmount: {
      type: Number,
      required: [true, "Tax amount is required"],
      min: [0, "Tax amount cannot be negative"],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount amount cannot be negative"],
    },
    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
      min: [0, "Total amount cannot be negative"],
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: ["registered", "paid", "delivered"],
        message: "Status must be registered, paid, or delivered",
      },
      default: "registered",
      index: true,
    },
    paymentMethod: {
      type: String,
      default: "invoice",
      trim: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

// Basic indexes for performance
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customerId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware
orderSchema.pre("save", function (next) {
  // Ensure registeredAt is set if not already present
  if (!this.registeredAt && this.isNew) {
    this.registeredAt = new Date();
  }
  next();
});

// Create and export the model
const Order = mongoose.model<IOrder>("Order", orderSchema);

export default Order;

// Validation function
export const validateCreateOrder = (data: unknown): CreateOrderInputType => {
  return CreateOrderZodSchema.parse(data);
};

// Helper function
export const calculateItemSubtotal = (quantity: number, unitPrice: number): number => {
  return Math.round(quantity * unitPrice * 100) / 100;
};
