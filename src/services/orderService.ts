import { calculateItemSubtotal } from "#utils/helper.js";
import { validateCreateOrder } from "../models/orders.js";
import * as orderRepository from "../repositories/orderRepository.js";
import type { CreateOrderInputType, IOrder } from "../models/orders.js";
import logger from "#utils/logger.js";

export const createOrder = async (orderData: CreateOrderInputType): Promise<IOrder> => {
  try {
    // Step 1: Validate the input data (without calculated fields)
    const validatedInput = validateCreateOrder(orderData);

    // Step 2: Calculate item subtotals
    const itemsWithSubtotals = validatedInput.items.map((item) => ({
      ...item,
      subtotal: calculateItemSubtotal(item.quantity, item.unitPrice),
    }));

    // Step 3: Calculate order totals
    const subtotal = itemsWithSubtotals.reduce((sum, item) => sum + item.subtotal, 0);
    const taxAmount = itemsWithSubtotals.reduce((sum, item) => sum + item.subtotal * item.taxRate, 0);
    const discountAmount = validatedInput.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Step 4: Create complete order data with all calculated fields
    const completeOrderData = {
      ...validatedInput,
      items: itemsWithSubtotals,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };

    // Step 5: Create the order with all required fields
    return await orderRepository.createOrder(completeOrderData);
  } catch (error) {
    logger.error("Error creating order:", error);
    throw error;
  }
};
