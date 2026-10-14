require("dotenv").config();
const requestRoutes = require("./src/routes/requestRoutes");
const commentRoutes = require("./src/routes/commentRoutes");
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const titleRoutes = require("./src/routes/titleRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/titles", titleRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/requests", requestRoutes);

app.get("/", (req, res) => {
  res.send("Scener backend is running!");
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});