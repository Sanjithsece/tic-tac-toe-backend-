const express = require("express");
const protect = require("../middleware/authMiddleware");
const { getUserMatches } = require("../controllers/matchController");

const router = express.Router();

router.get("/:userId", protect, getUserMatches);

module.exports = router;
