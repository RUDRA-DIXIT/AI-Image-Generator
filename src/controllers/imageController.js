const User = require("../models/User");
const Image = require("../models/Image");
const ApiError = require("../utils/apiError");
const { generateImage: generateImageFromProvider } = require("../services/groqService");
 
/**
 * POST /api/images/generate
 * Validates prompt/user/credits, generates an image via groqService,
 * persists the Image document, and deducts one credit from the user.
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
 
    const { imageUrl } = await generateImageFromProvider(prompt);
 
    await Image.create({
      user: user._id,
      prompt,
      imageUrl,
      status: "completed",
      creditsUsed: 1,
    });
 
    user.credits -= 1;
    await user.save();
 
    res.status(200).json({
      success: true,
      data: {
        imageUrl,
        remainingCredits: user.credits,
      },
    });
  } catch (error) {
    next(error);
  }
};
 
module.exports = { generateImage };