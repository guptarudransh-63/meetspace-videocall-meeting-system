import { env } from "../config/env.js";
class AppError extends Error {
  statusCode;
  isOperational;
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  if (err.code === 11e3) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `An entry with this ${field} already exists.`;
  }
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid format for field: ${err.path}`;
  }
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid authentication token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Authentication token expired";
  }
  if (env.NODE_ENV !== "test" && statusCode === 500) {
    console.error("Unhandled Server Error:", err);
  }
  res.status(statusCode).json({
    success: false,
    message,
    ...env.NODE_ENV === "development" && { stack: err.stack }
  });
};
export {
  AppError,
  errorHandler
};
