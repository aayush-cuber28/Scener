function calculateRating(ownerScore, userVotes) {
  if (typeof ownerScore !== "number" || ownerScore < 0 || ownerScore > 10) {
    throw new Error("Invalid owner score: must be a number between 0 and 10");
  }
  if (!Array.isArray(userVotes)) {
    throw new Error("userVotes must be an array");
  }

  const OWNER_WEIGHT = 3;

  const validVotes = userVotes.filter(
    (v) => typeof v === "number" && v >= 0 && v <= 10
  );

  const totalScore = ownerScore * OWNER_WEIGHT + validVotes.reduce((a, b) => a + b, 0);
  const totalWeight = OWNER_WEIGHT + validVotes.length;

  return Math.round((totalScore / totalWeight) * 10) / 10;
}

module.exports = { calculateRating };