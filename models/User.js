const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    rating: { type: Number, default: 1000 },
    resetPasswordToken: String,
    resetPasswordExpire: Date
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
