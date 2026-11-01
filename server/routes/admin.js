const express = require("express");
const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Show = require("../models/Show");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();
router.use(protect, adminOnly);

router.get("/stats", async (req, res, next) => {
  try {
    const [movies, shows, users, agg] = await Promise.all([
      Movie.countDocuments(),
      Show.countDocuments({ startTime: { $gt: new Date() } }),
      User.countDocuments({ role: "user" }),
      Booking.aggregate([
        { $match: { status: "confirmed" } },
        { $group: { _id: null, revenue: { $sum: "$totalPrice" }, tickets: { $sum: { $size: "$seats" } }, bookings: { $sum: 1 } } },
      ]),
    ]);
    const a = agg[0] || {};
    res.json({
      movies,
      upcomingShows: shows,
      users,
      bookings: a.bookings || 0,
      tickets: a.tickets || 0,
      revenue: a.revenue || 0,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/bookings", async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate("user", "name email")
      .populate({ path: "show", populate: { path: "movie", select: "title" } })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
