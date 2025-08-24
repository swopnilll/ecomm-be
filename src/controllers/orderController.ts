import { type Request, type Response } from "express";

import { handleServiceError } from "../utils/errors.js";
import * as orderService from "../services/orderService.js";

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await orderService.createOrder(req.body);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    handleServiceError(error as Error, res);
  }
};
