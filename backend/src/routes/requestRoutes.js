const express = require("express");
const {
  getRequests,
  createRequest,
  toggleUpvote,
  markReviewed,
} = require("../controllers/requestController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", getRequests);
router.post("/", protect, createRequest);
router.post("/:id/upvote", protect, toggleUpvote);
router.patch("/:id/reviewed", protect, adminOnly, markReviewed);

module.exports = router;