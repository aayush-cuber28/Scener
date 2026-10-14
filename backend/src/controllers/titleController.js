const mongoose = require("mongoose");
const Title = require("../models/Title");

async function createTitle(req, res) {
  try {
    const { name, category, year, reviewText, ownerScore, isMature } = req.body;

    if (!name || !category || !reviewText || ownerScore === undefined) {
      return res.status(400).json({ message: "name, category, reviewText and ownerScore are required" });
    }
    const score = Number(ownerScore);
    if (Number.isNaN(score) || score < 0 || score > 10) {
      return res.status(400).json({ message: "ownerScore must be a number from 0 to 10" });
    }

    const title = await Title.create({
      name,
      category,
      year: year ? Number(year) : undefined,
      reviewText,
      ownerScore: score,
      rating: score,
      isMature: isMature === "true" || isMature === true,
      poster: req.file ? `/uploads/${req.file.filename}` : "",
    });

    res.status(201).json(title);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function getTitles(req, res) {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const titles = await Title.find(filter).sort({ createdAt: -1 });
    res.json(titles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function getTitleById(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid title id" });
    }
    const title = await Title.findById(req.params.id);
    if (!title) {
      return res.status(404).json({ message: "Title not found" });
    }
    res.json(title);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createTitle, getTitles, getTitleById };