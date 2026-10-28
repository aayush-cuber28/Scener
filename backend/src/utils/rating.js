const Comment = require("../models/Comment");
const { calculateRating } = require("./ratingCalculator");

// Recalculates a title's combined rating from the owner score + every user score.
async function updateTitleRating(title) {
  const scored = await Comment.find({ title: title._id, score: { $ne: null } }).select("score");
  const votes = scored.map((c) => c.score);
  title.rating = calculateRating(title.ownerScore, votes);
  title.voteCount = votes.length;
  await title.save();
}

module.exports = { updateTitleRating };
