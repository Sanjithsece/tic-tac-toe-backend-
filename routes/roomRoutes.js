const express = require("express");
const router = express.Router();
const { createRoom, joinRoom, getPublicRooms } = require("../controllers/roomController");
const protect = require("../middleware/authMiddleware");

router.post("/create", protect, createRoom);
router.post("/join", protect, joinRoom);
router.get("/public", protect, getPublicRooms);

module.exports = router;
