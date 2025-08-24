import logger from "#utils/logger.js";
import Order, { type IOrder, type CreateOrderInputType } from "../models/orders.js";

export const createOrder = async (orderData: CreateOrderInputType): Promise<IOrder> => {
  try {
    const order = new Order(orderData);
    return await order.save();
  } catch (error) {
    logger.error(`Failed to create order: ${(error as Error).message}`);
    throw error;
  }
};
