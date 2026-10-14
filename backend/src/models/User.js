const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    nickname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

// Unique nickname, ignoring upper/lower case ("Aayush" and "aayush" count as the same)
userSchema.index(
  { nickname: 1 },
  { unique: true, collation: { locale: "en", strength: 2 } }
);

module.exports = mongoose.model("User", userSchema);