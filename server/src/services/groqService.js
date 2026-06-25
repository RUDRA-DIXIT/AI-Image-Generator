const ApiError = require("../utils/apiError");
 
/**
 * Generates an image URL for the given prompt.
 *
 * NOTE: this currently uses Pollinations as a stand-in image source rather
 * than calling the real Groq API — swap the URL construction below once
 * the actual Groq image generation endpoint is wired in.
 */
const generateImage = async (prompt) => {
  if (!prompt) {
    throw new ApiError(400, "VALIDATION_ERROR", "Prompt is required");
  }
 
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
 
  return { imageUrl };
};
 
module.exports = { generateImage };