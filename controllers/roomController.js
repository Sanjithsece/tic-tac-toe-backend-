const Room = require("../models/Room");
const generateRoomCode = require("../utils/generateRoomCode");

exports.createRoom = async (req, res) => {
  const { type } = req.body;

  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (await Room.findOne({ roomCode }));

  const room = await Room.create({
    roomCode,
    type,
    players: [req.user._id]
  });

  res.status(201).json(room);
};

exports.joinRoom = async (req, res) => {
  const { roomCode } = req.body;

  const room = await Room.findOne({ roomCode });

  if (!room)
    return res.status(404).json({ message: "Room not found" });

  if (room.players.includes(req.user._id))
    return res.status(400).json({ message: "Already joined" });

  if (room.players.length >= 2)
    return res.status(400).json({ message: "Room full" });

  room.players.push(req.user._id);

  if (room.players.length === 2) {
    room.status = "playing";
  }

  await room.save();

  res.json(room);
};
