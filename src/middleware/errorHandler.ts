import { type Request, type Response, type NextFunction } from "express";
import { HTTP_STATUS } from "../constants/httpStatusCodes.js";
import { error } from "../utils/apiResponse.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(error("Internal Server Error", HTTP_STATUS.INTERNAL_SERVER_ERROR));
};
