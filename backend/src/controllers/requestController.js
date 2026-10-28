const mongoose = require("mongoose");
const TitleRequest = require("../models/TitleRequest");
const User = require("../models/User");
const { containsProfanity } = require("../utils/profanityFilter");
const { isValidCategory } = require("../utils/genres");

async function getRequests(req, res) {
  try {
    const status = req.query.status === "reviewed" ? "reviewed" : "open";
    const requests = await TitleRequest.find({ status });

    const list = requests
      .map((r) => ({ ...r.toObject(), upvoteCount: r.upvotes.length }))
      .sort(
        (a, b) =>
          b.upvoteCount - a.upvoteCount ||
          new Date(b.createdAt) - new Date(a.createdAt)
      );

    res.json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function createRequest(req, res) {
  try {
    const { name, category, note } = req.body;

    if (!name || !name.trim() || !category) {
      return res.status(400).json({ message: "name and category are required" });
    }
    if (!isValidCategory(category)) {
      return res.status(400).json({ message: "category must be movie, song or series" });
    }
    if (name.length > 100 || (note && note.length > 300)) {
      return res.status(400).json({ message: "Name max 100 characters, note max 300" });
    }
    if (containsProfanity(name) || containsProfanity(note || "")) {
      return res.status(400).json({ message: "Please keep it respectful. Bad language is not allowed." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    const existing = await TitleRequest.findOne({
      name: name.trim(),
      category,
      status: "open",
    }).collation({ locale: "en", strength: 2 });

    if (existing) {
      return res.status(409).json({
        message: "Already requested. Upvote it instead!",
        requestId: existing._id,
      });
    }

    const created = await TitleRequest.create({
      name: name.trim(),
      category,
      note: note ? note.trim() : "",
      requestedBy: user._id,
      nickname: user.nickname,
      upvotes: [user._id],
    });

    res.status(201).json({ ...created.toObject(), upvoteCount: 1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function toggleUpvote(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }

    const request = await TitleRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const index = request.upvotes.findIndex((u) => u.toString() === req.user.id);
    if (index === -1) {
      request.upvotes.push(req.user.id);
    } else {
      request.upvotes.splice(index, 1);
    }
    await request.save();

    res.json({ upvoteCount: request.upvotes.length, upvoted: index === -1 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function markReviewed(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid request id" });
    }
    const request = await TitleRequest.findByIdAndUpdate(
      id,
      { status: "reviewed" },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { getRequests, createRequest, toggleUpvote, markReviewed };