import { type RequestHandler, type Request, type Response, type NextFunction } from "express";

import { HTTP_STATUS, type HttpStatusCode } from "../constants/httpStatusCodes.js";

type ApiResponse<T> = {
  statusCode: HttpStatusCode;
  message: string;
  data?: T;
};

export const success = <T>(data: T, message = "Success", statusCode: HttpStatusCode = HTTP_STATUS.OK): ApiResponse<T> => ({
  statusCode,
  message,
  data,
});

export const error = (message: string, statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR): ApiResponse<null> => ({
  statusCode,
  message,
});

export const asyncHandler = <Req extends Request = Request, Res extends Response = Response>(
  fn: (req: Req, res: Res, next: NextFunction) => Promise<unknown>,
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res as Res, next)).catch(next);
  };
};
