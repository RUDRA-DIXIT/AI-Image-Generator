const express = require("express");

const { generateImage } = require("../controllers/imageController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/generate", protect, generateImage);

module.exports = router;