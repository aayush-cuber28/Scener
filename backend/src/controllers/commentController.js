const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Title = require("../models/Title");
const User = require("../models/User");
const { containsProfanity } = require("../utils/profanityFilter");
const { getAge, canViewMature } = require("../utils/age");
const { updateTitleRating } = require("../utils/rating");

async function addComment(req, res) {
  try {
    const { titleId } = req.params;
    const { text, score, parentId } = req.body;

    if (!mongoose.isValidObjectId(titleId)) {
      return res.status(400).json({ message: "Invalid title id" });
    }
    if (typeof text !== "string" || !text.trim()) {
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

    if (title.isMature && user.role !== "admin" && getAge(user.dateOfBirth) < 18) {
      return res.status(403).json({ message: "This content is 18+ only" });
    }

    // Replies: always attach to the top-level comment so threads stay one level deep.
    let parent = null;
    if (parentId) {
      if (!mongoose.isValidObjectId(parentId)) {
        return res.status(400).json({ message: "Invalid comment id" });
      }
      const parentComment = await Comment.findById(parentId);
      if (!parentComment || parentComment.title.toString() !== titleId) {
        return res.status(404).json({ message: "The comment you are replying to no longer exists" });
      }
      parent = parentComment.parent || parentComment._id;
    }

    const hasScore = score !== undefined && score !== null && score !== "";
    let scoreValue = null;
    if (hasScore) {
      if (parent) {
        return res.status(400).json({ message: "Ratings can only be given in a main comment, not a reply" });
      }
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
      parent,
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
    const title = await Title.findById(titleId).select("isMature");
    if (!title) {
      return res.status(404).json({ message: "Title not found" });
    }
    if (title.isMature && !(await canViewMature(req))) {
      return res.status(403).json({ message: "This content is 18+ only", locked: true });
    }
    const comments = await Comment.find({ title: titleId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function toggleLike(req, res) {
  try {
    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.user.toString() === req.user.id) {
      return res.status(400).json({ message: "You can't like your own comment" });
    }

    const index = comment.likes.findIndex((u) => u.toString() === req.user.id);
    if (index === -1) comment.likes.push(req.user.id);
    else comment.likes.splice(index, 1);
    await comment.save();

    res.json({ likeCount: comment.likes.length, liked: index === -1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

// The comment's author or the admin can delete it. Deleting a comment also deletes its replies.
async function deleteComment(req, res) {
  try {
    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid comment id" });
    }
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
    if (comment.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    await Comment.deleteMany({ $or: [{ _id: comment._id }, { parent: comment._id }] });

    if (comment.score !== null) {
      const title = await Title.findById(comment.title);
      if (title) await updateTitleRating(title);
    }

    res.json({ message: "Comment deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { addComment, getComments, toggleLike, deleteComment };
