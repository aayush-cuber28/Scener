// The Express app (no database connection or app.listen here, so tests can import it).
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const authRoutes = require("./src/routes/authRoutes");
const titleRoutes = require("./src/routes/titleRoutes");
const commentRoutes = require("./src/routes/commentRoutes");
const requestRoutes = require("./src/routes/requestRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/titles", titleRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/requests", requestRoutes);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api", (req, res) => res.status(404).json({ message: "Not found" }));

// Posters saved on local disk (only used when Cloudinary is not configured).
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// In production the backend also serves the built React app (frontend/dist).
const distPath = path.join(__dirname, "../frontend/dist");
if (process.env.NODE_ENV === "production" && fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Any other GET (like /title/123) loads the React app, which handles the page itself.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/uploads/")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("Scener backend is running!");
  });
}

// Turns upload and JSON errors into readable messages instead of a crash page.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Poster must be 3 MB or smaller" : err.message;
    return res.status(400).json({ message });
  }
  if (err.message === "Only image files are allowed") {
    return res.status(400).json({ message: err.message });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON in request body" });
  }
  console.error(err);
  res.status(500).json({ message: "Server error" });
});

module.exports = app;
