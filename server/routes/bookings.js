const express = require("express");
const Booking = require("../models/Booking");
const Show = require("../models/Show");
const { protect } = require("../middleware/auth");

const router = express.Router();

const MAX_SEATS = 8;

const populateBooking = (q) =>
  q.populate({ path: "show", populate: { path: "movie", select: "title poster" } });

// Book seats
router.post("/", protect, async (req, res, next) => {
  try {
    const { showId, seats } = req.body;
    if (!showId || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ message: "Show and at least one seat are required" });
    }
    const unique = [...new Set(seats.map(String))];
    if (unique.length > MAX_SEATS) {
      return res.status(400).json({ message: `You can book at most ${MAX_SEATS} seats at a time` });
    }

    const show = await Show.findById(showId);
    if (!show) return res.status(404).json({ message: "Show not found" });
    if (show.startTime <= new Date()) {
      return res.status(400).json({ message: "This show has already started" });
    }
    const valid = show.validSeatSet();
    if (!unique.every((s) => valid.has(s))) {
      return res.status(400).json({ message: "Invalid seat selected" });
    }

    // Atomic reservation: only succeeds if none of the seats are already taken,
    // so two people clicking the same seat can never both win.
    const reserved = await Show.findOneAndUpdate(
      { _id: show._id, bookedSeats: { $not: { $elemMatch: { $in: unique } } } },
      { $push: { bookedSeats: { $each: unique } } },
      { new: true }
    );
    if (!reserved) {
      return res.status(409).json({ message: "Some of those seats were just taken. Please pick again." });
    }

    try {
      const booking = await Booking.create({
        user: req.user._id,
        show: show._id,
        seats: unique,
        totalPrice: unique.length * show.price,
      });
      res.status(201).json(await populateBooking(Booking.findById(booking._id)));
    } catch (err) {
      // roll back the reservation if the booking record failed
      await Show.updateOne({ _id: show._id }, { $pull: { bookedSeats: { $in: unique } } });
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

// My bookings
router.get("/mine", protect, async (req, res, next) => {
  try {
    const bookings = await populateBooking(
      Booking.find({ user: req.user._id }).sort({ createdAt: -1 })
    );
    res.json(bookings);
  } catch (err) {
    next(err);
  }
});

// Cancel (owner before show starts; admin any time)
router.put("/:id/cancel", protect, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("show");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not allowed" });
    if (booking.status === "cancelled") return res.status(400).json({ message: "Already cancelled" });
    if (!isAdmin && booking.show && booking.show.startTime <= new Date()) {
      return res.status(400).json({ message: "Cannot cancel after the show has started" });
    }

    booking.status = "cancelled";
    await booking.save();
    if (booking.show) {
      await Show.updateOne({ _id: booking.show._id }, { $pull: { bookedSeats: { $in: booking.seats } } });
    }
    res.json(booking);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
