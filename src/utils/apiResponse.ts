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
