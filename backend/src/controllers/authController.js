const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validateNickname, isValidEmail } = require("../utils/validators");

function makeToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
  try {
    const { nickname, email, password, dateOfBirth } = req.body;

    if (!nickname || !email || !password || !dateOfBirth) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!validateNickname(nickname)) {
      return res.status(400).json({
        message: "Nickname must be 3-15 characters: letters, numbers, underscore only",
      });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const nicknameTaken = await User.findOne({ nickname }).collation({ locale: "en", strength: 2 });
    if (nicknameTaken) {
      return res.status(409).json({ message: "Nickname already taken" });
    }
    const emailTaken = await User.findOne({ email: email.toLowerCase() });
    if (emailTaken) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      nickname,
      email,
      password: hashedPassword,
      dateOfBirth,
    });

    res.status(201).json({
      token: makeToken(user),
      user: { id: user._id, nickname: user.nickname, role: user.role },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Nickname or email already in use" });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: makeToken(user),
      user: { id: user._id, nickname: user.nickname, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = { register, login };