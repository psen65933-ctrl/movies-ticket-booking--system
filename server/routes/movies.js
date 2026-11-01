const express = require("express");
const Movie = require("../models/Movie");
const Show = require("../models/Show");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/movies?search=&genre=&language=
router.get("/", async (req, res, next) => {
  try {
    const { search, genre, language } = req.query;
    const filter = { isActive: true };
    if (search) filter.title = new RegExp(escapeRegex(search), "i");
    if (genre) filter.genre = genre;
    if (language) filter.language = language;
    res.json(await Movie.find(filter).sort({ releaseDate: -1 }));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  } catch (err) {
    next(err);
  }
});

router.post("/", protect, adminOnly, async (req, res, next) => {
  try {
    res.status(201).json(await Movie.create(req.body));
  } catch (err) {
    next(err);
  }
});

router.put("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    res.json(movie);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", protect, adminOnly, async (req, res, next) => {
  try {
    const upcoming = await Show.exists({ movie: req.params.id, startTime: { $gt: new Date() }, "bookedSeats.0": { $exists: true } });
    if (upcoming) {
      return res.status(400).json({ message: "Movie has upcoming shows with bookings. Cancel those first." });
    }
    const movie = await Movie.findByIdAndDelete(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });
    await Show.deleteMany({ movie: movie._id });
    res.json({ message: "Movie deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
