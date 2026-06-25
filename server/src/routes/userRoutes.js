const express = require("express");
 
const { getCredits } = require("../controllers/userController");
const { protect } = require("../middlewares/authMiddleware");
 
const router = express.Router();
 
router.get("/credits", protect, getCredits);
 
module.exports = router;
 