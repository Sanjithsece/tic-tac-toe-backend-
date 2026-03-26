const Room = require("../models/Room");
const generateRoomCode = require("../utils/generateRoomCode");

exports.createRoom = async (req, res) => {
  try {
    const type = req.body.type?.trim();

    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!["public", "private"].includes(type)) {
      return res.status(400).json({ message: "Invalid room type" });
    }

    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (await Room.findOne({ roomCode }));

    const room = await Room.create({
      roomCode,
      type,
      players: [req.user._id],
      status: "waiting"
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};

exports.getPublicRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      type: "public",
      status: "waiting"
    }).select("roomCode players createdAt");

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.joinRoom = async (req, res) => {
  try {
    const roomCode = req.body.roomCode?.trim().toUpperCase();

    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roomCode) {
      return res.status(400).json({ message: "Room code is required" });
    }

    const room = await Room.findOne({ roomCode });

    if (!room)
      return res.status(404).json({ message: "Room not found" });

    const alreadyJoined = room.players.some(
      (playerId) => playerId.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res.json(room);
    }

    if (room.players.length >= 2)
      return res.status(400).json({ message: "Room full" });

    room.players.push(req.user._id);

    if (room.players.length === 2) {
      room.status = "playing";
    }

    await room.save();

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message || "Server Error" });
  }
};
