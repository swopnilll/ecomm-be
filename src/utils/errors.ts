import { ZodError } from "zod";
import { type Response } from "express";

import logger from "./logger.js";

export class UserNotFoundError extends Error {
  constructor(message: string = "User not found") {
    super(message);
    this.name = "UserNotFoundError";
  }
}

export class EmailAlreadyExistsError extends Error {
  constructor(message: string = "Email already exists") {
    super(message);
    this.name = "EmailAlreadyExistsError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ProductNotFoundError extends Error {
  constructor(message: string = "Product not found") {
    super(message);
    this.name = "ProductNotFoundError";
  }
}

export class ProductAlreadyExistsError extends Error {
  constructor(message: string = "Product with this name already exists") {
    super(message);
    this.name = "ProductAlreadyExistsError";
  }
}

export class InsufficientStockError extends Error {
  constructor(message: string = "Insufficient stock available") {
    super(message);
    this.name = "InsufficientStockError";
  }
}

export class InvalidProductStatusError extends Error {
  constructor(message: string = "Invalid product status") {
    super(message);
    this.name = "InvalidProductStatusError";
  }
}

// Update the handleServiceError function to include these new errors:
export const handleServiceError = (error: Error, res: Response) => {
  if (error instanceof UserNotFoundError) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof ProductNotFoundError) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof EmailAlreadyExistsError) {
    return res.status(409).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof ProductAlreadyExistsError) {
    return res.status(409).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof InsufficientStockError) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof InvalidProductStatusError) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof UnauthorizedError) {
    return res.status(403).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues,
    });
  }

  // Generic error
  logger.error("Unexpected error:", error);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
