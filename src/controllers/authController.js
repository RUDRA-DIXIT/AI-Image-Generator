
const jwt = require("jsonwebtoken");
 
const User = require("../models/User");
const ApiError = require("../utils/apiError");
 
/**
 * Signs a JWT for the given user id.
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};
 
/**
 * Shapes a Mongoose User document into the public user object
 * returned in API responses (never includes the password hash).
 */
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  credits: user.credits,
});
 
/**
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
 
    if (!name || !email || !password) {
      throw new ApiError(400, "VALIDATION_ERROR", "Name, email, and password are all required");
    }
 
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "An account with this email already exists");
    }
 
    // Password hashing happens automatically via the User model's pre-save hook
    const user = await User.create({ name, email, password });
 
    const token = generateToken(user._id);
 
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        user: toPublicUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};
 
/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      throw new ApiError(400, "VALIDATION_ERROR", "Email and password are required");
    }
 
    // password is select:false on the schema, so it must be explicitly requested
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
 
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }
 
    const token = generateToken(user._id);
 
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: toPublicUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }

    res.status(200).json({
      success: true,
      data: {
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
};
 
module.exports = {
  signup,
  login,
  getMe,
};