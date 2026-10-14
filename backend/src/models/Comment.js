const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    title: { type: mongoose.Schema.Types.ObjectId, ref: "Title", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    nickname: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
    score: { type: Number, min: 0, max: 10, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", commentSchema);