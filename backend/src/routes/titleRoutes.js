const express = require("express");
const {
  createTitle,
  getTitles,
  getTitleById,
  updateTitle,
  deleteTitle,
} = require("../controllers/titleController");
const { protect, optionalAuth, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { GENRES } = require("../utils/genres");

const router = express.Router();

router.get("/genres", (req, res) => res.json(GENRES));
router.get("/", optionalAuth, getTitles);
router.get("/:id", optionalAuth, getTitleById);
router.post("/", protect, adminOnly, upload.single("poster"), createTitle);
router.put("/:id", protect, adminOnly, upload.single("poster"), updateTitle);
router.delete("/:id", protect, adminOnly, deleteTitle);

module.exports = router;
