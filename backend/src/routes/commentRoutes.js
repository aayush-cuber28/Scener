const express = require("express");
const { addComment, getComments, toggleLike, deleteComment } = require("../controllers/commentController");
const { protect, optionalAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/:titleId", optionalAuth, getComments);
router.post("/:titleId", protect, addComment);
router.post("/:commentId/like", protect, toggleLike);
router.delete("/:commentId", protect, deleteComment);

module.exports = router;
