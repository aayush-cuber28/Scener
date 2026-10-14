const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, enum: ["movie", "song", "series"], required: true },
    note: { type: String, trim: true, maxlength: 300, default: "" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    nickname: { type: String, required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, enum: ["open", "reviewed"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TitleRequest", requestSchema);