const express = require("express");
const { addComment, getComments } = require("../controllers/commentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/:titleId", getComments);
router.post("/:titleId", protect, addComment);

module.exports = router;