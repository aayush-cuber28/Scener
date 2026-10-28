const mongoose = require("mongoose");
const { CATEGORIES } = require("../utils/genres");

const titleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    genres: [{ type: String }],
    year: { type: Number },
    reviewText: { type: String, required: true },
    ownerScore: { type: Number, required: true, min: 0, max: 10 },
    rating: { type: Number, default: 0 },
    voteCount: { type: Number, default: 0 },
    isMature: { type: Boolean, default: false },
    poster: { type: String, default: "" },
    posterId: { type: String, default: "" }, // Cloudinary id, used to delete the old image
  },
  { timestamps: true }
);

module.exports = mongoose.model("Title", titleSchema);
