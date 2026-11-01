const mongoose = require("mongoose");

const showSchema = new mongoose.Schema(
  {
    movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
    theatre: { type: String, required: true, trim: true },
    screen: { type: String, required: true, trim: true },
    startTime: { type: Date, required: true },
    price: { type: Number, required: true, min: 0 },
    rows: { type: Number, default: 8, min: 1, max: 26 },
    cols: { type: Number, default: 10, min: 1, max: 30 },
    // seat ids like "A1", "C7". Updated atomically when booking/cancelling.
    bookedSeats: { type: [String], default: [] },
  },
  { timestamps: true }
);

showSchema.index({ movie: 1, startTime: 1 });

// Valid seat ids for this show's layout
showSchema.methods.validSeatSet = function () {
  const set = new Set();
  for (let r = 0; r < this.rows; r++) {
    for (let c = 1; c <= this.cols; c++) set.add(String.fromCharCode(65 + r) + c);
  }
  return set;
};

module.exports = mongoose.model("Show", showSchema);
