const express = require("express");

const { generateImage, getImageHistory } = require("../controllers/imageController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/generate", protect, generateImage);
router.get("/history", protect, getImageHistory);

module.exports = router;