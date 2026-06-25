const User = require("../models/User");
const ApiError = require("../utils/apiError");
 
/**
 * POST /api/images/generate
 * Placeholder — validates prompt, user, and credits, but does NOT call
 * the image generation provider yet. That integration comes later.
 */
const generateImage = async (req, res, next) => {
  try {
    const { prompt } = req.body;
 
    if (!prompt) {
      throw new ApiError(400, "VALIDATION_ERROR", "Prompt is required");
    }
 
    const user = await User.findById(req.user.userId);
 
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }
 
    if (user.credits <= 0) {
      throw new ApiError(400, "INSUFFICIENT_CREDITS", "You do not have enough credits to generate an image");
    }
 
    // TODO: call Groq image generation service here
    // TODO: upload result to Cloudinary
    // TODO: save Image document
    // TODO: atomically decrement user credits
 
    res.status(200).json({
      success: true,
      message: "Image generation controller placeholder ready",
    });
  } catch (error) {
    next(error);
  }
};
 
module.exports = { generateImage };