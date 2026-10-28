const mongoose = require("mongoose");
const Title = require("../models/Title");
const Comment = require("../models/Comment");
const TitleRequest = require("../models/TitleRequest");
const { isValidCategory, cleanGenres } = require("../utils/genres");
const { canViewMature } = require("../utils/age");
const { savePoster, deletePoster } = require("../utils/storage");
const { updateTitleRating } = require("../utils/rating");

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Hides the review text of 18+ titles from guests and under-18 users.
function toPublic(title, canSeeMature) {
  const data = title.toObject();
  delete data.posterId;
  data.locked = data.isMature && !canSeeMature;
  if (data.locked) delete data.reviewText;
  return data;
}

// Checks the add/edit form. Returns { error } or { fields }.
function readTitleForm(body) {
  const { name, category, year, reviewText, ownerScore, isMature, genres } = body;

  if (!name || !name.trim() || !category || !reviewText || !reviewText.trim() ||
      ownerScore === undefined || ownerScore === "") {
    return { error: "name, category, reviewText and ownerScore are required" };
  }
  if (!isValidCategory(category)) {
    return { error: "category must be movie, song or series" };
  }
  const genreList = cleanGenres(category, genres);
  if (genreList === null) {
    return { error: "One or more genres are not valid for this category" };
  }
  const score = Number(ownerScore);
  if (Number.isNaN(score) || score < 0 || score > 10) {
    return { error: "ownerScore must be a number from 0 to 10" };
  }
  let yearValue;
  if (year !== undefined && year !== null && year !== "") {
    yearValue = Number(year);
    const maxYear = new Date().getFullYear() + 5;
    if (!Number.isInteger(yearValue) || yearValue < 1880 || yearValue > maxYear) {
      return { error: `Year must be between 1880 and ${maxYear}` };
    }
  }

  return {
    fields: {
      name: name.trim(),
      category,
      genres: genreList,
      year: yearValue,
      reviewText: reviewText.trim(),
      ownerScore: score,
      isMature: isMature === "true" || isMature === true,
    },
  };
}

async function createTitle(req, res) {
  try {
    const { error, fields } = readTitleForm(req.body);
    if (error) return res.status(400).json({ message: error });

    let poster = { url: "", id: "" };
    if (req.file) poster = await savePoster(req.file);

    const title = await Title.create({
      ...fields,
      rating: fields.ownerScore,
      poster: poster.url,
      posterId: poster.id,
    });

    // If people had requested this title, mark their request as reviewed.
    await TitleRequest.updateMany(
      { name: fields.name, category: fields.category, status: "open" },
      { status: "reviewed" },
      { collation: { locale: "en", strength: 2 } }
    );

    res.status(201).json(toPublic(title, true));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function getTitles(req, res) {
  try {
    const { category, genre, search, sort } = req.query;
    const filter = {};
    if (category && isValidCategory(category)) filter.category = category;
    if (genre) filter.genres = String(genre);
    if (search && String(search).trim()) {
      filter.name = { $regex: escapeRegex(String(search).trim()), $options: "i" };
    }

    let order = { createdAt: -1 };
    if (sort === "rating") order = { rating: -1, createdAt: -1 };
    if (sort === "name") order = { name: 1 };

    const titles = await Title.find(filter).sort(order).collation({ locale: "en" });
    const canSeeMature = await canViewMature(req);
    res.json(titles.map((t) => toPublic(t, canSeeMature)));
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
    res.json(toPublic(title, await canViewMature(req)));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function updateTitle(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid title id" });
    }
    const title = await Title.findById(req.params.id);
    if (!title) {
      return res.status(404).json({ message: "Title not found" });
    }

    const { error, fields } = readTitleForm(req.body);
    if (error) return res.status(400).json({ message: error });

    const oldPoster = { url: title.poster, id: title.posterId };
    let posterChanged = false;
    if (req.file) {
      const poster = await savePoster(req.file);
      title.poster = poster.url;
      title.posterId = poster.id;
      posterChanged = true;
    } else if (req.body.removePoster === "true") {
      title.poster = "";
      title.posterId = "";
      posterChanged = true;
    }

    Object.assign(title, fields);
    await updateTitleRating(title); // owner score may have changed; this also saves

    if (posterChanged) await deletePoster(oldPoster.url, oldPoster.id);

    res.json(toPublic(title, true));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function deleteTitle(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid title id" });
    }
    const title = await Title.findById(req.params.id);
    if (!title) {
      return res.status(404).json({ message: "Title not found" });
    }
    await Comment.deleteMany({ title: title._id });
    await title.deleteOne();
    await deletePoster(title.poster, title.posterId);
    res.json({ message: "Review deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { createTitle, getTitles, getTitleById, updateTitle, deleteTitle };
