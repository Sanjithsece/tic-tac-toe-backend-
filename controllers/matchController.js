    const Match = require("../models/Match");

exports.getUserMatches = async (req, res) => {
  const matches = await Match.find({
    $or: [{ player1: req.params.userId }, { player2: req.params.userId }]
  })
    .populate("player1 player2 winner", "username")
    .sort({ createdAt: -1 });

  res.json(matches);
};
