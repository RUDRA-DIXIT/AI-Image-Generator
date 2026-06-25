const jwt = require("jsonwebtoken");
 
const ApiError = require("../utils/apiError");
 
/**
 * Verifies the Bearer JWT on the Authorization header and attaches
 * req.user = { userId } for downstream controllers/middlewares to use.
 *
 * Expected header format:
 *   Authorization: Bearer <token>
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
 
  if (!authHeader) {
    return next(new ApiError(401, "UNAUTHORIZED", "Authorization header is missing"));
  }
 
  if (!authHeader.startsWith("Bearer ")) {
    return next(new ApiError(401, "UNAUTHORIZED", "Authorization header must start with 'Bearer'"));
  }
 
  const token = authHeader.split(" ")[1];
 
  if (!token) {
    return next(new ApiError(401, "UNAUTHORIZED", "Token is missing"));
  }
 
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    return next(new ApiError(401, "UNAUTHORIZED", "Invalid or expired token"));
  }
};
 
module.exports = { protect };
 