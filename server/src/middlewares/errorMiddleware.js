/**
 * 404 handler — catches any request that didn't match a defined route.
 * Must be registered AFTER all routes, BEFORE errorHandler.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Centralized error handler — formats every thrown/forwarded error into
 * the uniform error envelope defined in the architecture document:
 *   { success: false, message: "string", error: "ERROR_CODE" }
 *
 * Controllers (once added) can throw errors with a `statusCode` and
 * `code` property to control the response; anything else defaults to 500.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let errorCode = err.code || "INTERNAL_SERVER_ERROR";

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    errorCode = "RESOURCE_NOT_FOUND";
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    errorCode = "DUPLICATE_FIELD";
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    error: errorCode,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
