const express = require("express");
const Show = require("../models/Show");
const Booking = require("../models/Booking");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// GET /api/shows?movie=<id>  -> upcoming shows only
router.get("/", async (req, res, next) => {
  try {
    const filter = { startTime: { $gt: new Date() } };
    if (req.query.movie) filter.movie = req.query.movie;
    const shows = await Show.find(filter).populate("movie", "title").sort({ startTime: 1 });
    res.json(shows);
  } catch (err) {
    next(err);
  }
});

// Admin: every show including past ones
router.get("/all", protect, adminOnly, async (req, res, next) => {
  try {
    res.json(await Show.find().populate("movie", "title").sort({ startTime: -1 }));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id).populate("movie");
    if (!show) return res.status(404).json({ message: "Show not found" });
    res.json(show);
  } catch (err) {
    next(err);
  }
});

router.post("/", protect, adminOnly, async (req, res, next) => {
  try {
    const { bookedSeats, ...data } = req.body; // never accept seats from the client
    const show = await Show.create(data);
    res.status(201).json(show);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const show = await Show.findByIdAndDelete(req.params.id);
    if (!show) return res.status(404).json({ message: "Show not found" });
    await Booking.updateMany({ show: show._id, status: "confirmed" }, { status: "cancelled" });
    res.json({ message: "Show deleted and its bookings cancelled" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
