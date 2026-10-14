const mongoose = require("mongoose");

const titleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ["movie", "song", "series"], required: true },
    year: { type: Number },
    reviewText: { type: String, required: true },
    ownerScore: { type: Number, required: true, min: 0, max: 10 },
    rating: { type: Number, default: 0 },
    voteCount: { type: Number, default: 0 },
    isMature: { type: Boolean, default: false },
    poster: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Title", titleSchema);