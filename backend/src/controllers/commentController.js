const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Title = require("../models/Title");
const User = require("../models/User");
const { calculateRating } = require("../utils/ratingCalculator");
const { containsProfanity } = require("../utils/profanityFilter");

function getAge(dateOfBirth) {
  const today = new Date();
  const dob = new Date(dateOfBirth);
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthday =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

async function updateTitleRating(title) {
  const scored = await Comment.find({ title: title._id, score: { $ne: null } });
  const votes = scored.map((c) => c.score);
  title.rating = calculateRating(title.ownerScore, votes);
  title.voteCount = votes.length;
  await title.save();
}

async function addComment(req, res) {
  try {
    const { titleId } = req.params;
    const { text, score } = req.body;

    if (!mongoose.isValidObjectId(titleId)) {
      return res.status(400).json({ message: "Invalid title id" });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment cannot be empty" });
    }
    if (text.length > 500) {
      return res.status(400).json({ message: "Comment must be 500 characters or less" });
    }
    if (containsProfanity(text)) {
      return res.status(400).json({ message: "Please keep the discussion respectful. Bad language is not allowed." });
    }

    const title = await Title.findById(titleId);
    if (!title) {
      return res.status(404).json({ message: "Title not found" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (title.isMature && getAge(user.dateOfBirth) < 18) {
      return res.status(403).json({ message: "This content is 18+ only" });
    }

    let scoreValue = null;
    if (score !== undefined && score !== null && score !== "") {
      scoreValue = Number(score);
      if (Number.isNaN(scoreValue) || scoreValue < 0 || scoreValue > 10) {
        return res.status(400).json({ message: "Score must be a number from 0 to 10" });
      }
      const alreadyRated = await Comment.findOne({
        title: titleId,
        user: user._id,
        score: { $ne: null },
      });
      if (alreadyRated) {
        return res.status(409).json({ message: "You have already rated this title" });
      }
    }

    const comment = await Comment.create({
      title: titleId,
      user: user._id,
      nickname: user.nickname,
      text: text.trim(),
      score: scoreValue,
    });

    if (scoreValue !== null) {
      await updateTitleRating(title);
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function getComments(req, res) {
  try {
    const { titleId } = req.params;
    if (!mongoose.isValidObjectId(titleId)) {
      return res.status(400).json({ message: "Invalid title id" });
    }
    const comments = await Comment.find({ title: titleId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { addComment, getComments };