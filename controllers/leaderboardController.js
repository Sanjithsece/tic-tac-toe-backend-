const User = require("../models/User");

exports.getLeaderboard = async (req, res) => {
  const topPlayers = await User.find()
    .sort({ rating: -1 })
    .limit(10)
    .select("username wins rating");

  res.json(topPlayers);
};
