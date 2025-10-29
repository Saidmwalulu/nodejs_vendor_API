// middlewares/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import logger from "../utils/logger";
import { AppError, ValidationError } from "../types/custom-errors";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log error for debugging
  logger.error({
    name: err.name,
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
  });

  let status = 500;
  let error_code = 500;
  let message = "Internal server error";

  // Handle custom application errors
  if (err instanceof AppError) {
    status = err.statusCode;
    error_code = err.statusCode;
    message = err.message;
  }

  // Handle validation errors (Zod)
  else if (err instanceof ZodError) {
    status = 400;
    error_code = 400;

    // Get the first Zod validation issue
    const firstIssue = err.issues[0];
    message = firstIssue?.message || "Validation failed";
  }

  // Return simplified error response
  res.status(status).json({
    success: false,
    error_code,
    message,
  });
}
