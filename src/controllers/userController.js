const User = require("../models/User");
const ApiError = require("../utils/apiError");
 
/**
 * GET /api/user/credits
 * Protected — requires `protect` middleware to have set req.user.userId
 */
const getCredits = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
 
    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User not found");
    }
 
    res.status(200).json({
      success: true,
      data: {
        credits: user.credits,
      },
    });
  } catch (error) {
    next(error);
  }
};
 
module.exports = { getCredits };