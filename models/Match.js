const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    player1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    player2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    moves: [Number],
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);
