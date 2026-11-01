const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    genre: [String],
    language: { type: String, default: "English" },
    durationMins: { type: Number, required: true, min: 1 },
    rating: { type: Number, min: 0, max: 10, default: 0 },
    certificate: { type: String, default: "UA" },
    poster: { type: String, default: "" },
    releaseDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

movieSchema.index({ title: "text" });

module.exports = mongoose.model("Movie", movieSchema);
