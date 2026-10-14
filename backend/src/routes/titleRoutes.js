const express = require("express");
const { createTitle, getTitles, getTitleById } = require("../controllers/titleController");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", getTitles);
router.get("/:id", getTitleById);
router.post("/", protect, adminOnly, upload.single("poster"), createTitle);

module.exports = router;