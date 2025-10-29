// errors.ts

// Base reusable error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean; // helps differentiate operational vs programming errors

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 - Bad Request
export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(message, 400);
  }
}

// 401 - Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401);
  }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

// 404 - Not Found
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message = "Conflict occurred") {
    super(message, 409);
  }
}

// 422 - Unprocessable Entity (often used for validation errors)
export class ValidationError extends AppError {
  public details?: unknown;

  constructor(message = "Validation failed", details?: unknown) {
    super(message, 422);
    this.details = details;
  }
}

// 429 - Too Many Requests (rate limiting / throttling)
export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests, please try again later") {
    super(message, 429);
  }
}

// 500 - Internal Server Error
export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(message, 500, false); // false = not operational (developer bug)
  }
}
