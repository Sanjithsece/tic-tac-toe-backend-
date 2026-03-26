const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      unique: true,
      required: true
    },
    type: {
      type: String,
      enum: ["public", "private"],
      required: true
    },
    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting"
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
