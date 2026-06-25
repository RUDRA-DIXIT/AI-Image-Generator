
const mongoose = require("mongoose");
 
const imageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    creditsUsed: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);
 
const Image = mongoose.model("Image", imageSchema);
 
module.exports = Image;