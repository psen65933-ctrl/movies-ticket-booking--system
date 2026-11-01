require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Movie = require("./models/Movie");
const Show = require("./models/Show");
const Booking = require("./models/Booking");

// Original, fictional titles (no real posters or trademarks).
// The frontend draws a gradient poster when no poster URL is given.
const movies = [
  { title: "Midnight Express Lane", genre: ["Thriller", "Action"], language: "English", durationMins: 128, rating: 8.1, certificate: "UA",
    description: "A night-shift bus driver discovers her route is being used to smuggle something far more dangerous than cargo." },
  { title: "The Last Monsoon", genre: ["Drama", "Romance"], language: "Hindi", durationMins: 142, rating: 8.4, certificate: "U",
    description: "Two strangers share a rented house during one very long rainy season and slowly rewrite each other's plans." },
  { title: "Robo Kitchen", genre: ["Comedy", "Family"], language: "English", durationMins: 104, rating: 7.6, certificate: "U",
    description: "A failing family restaurant gets an unlikely rescue from a kitchen robot with strong opinions about spice." },
  { title: "Star Harbour", genre: ["Sci-Fi", "Adventure"], language: "English", durationMins: 151, rating: 8.7, certificate: "UA",
    description: "When the last port between two galaxies goes silent, a salvage crew must decide who to trust." },
  { title: "Kaveri Express", genre: ["Comedy", "Drama"], language: "Tamil", durationMins: 136, rating: 7.9, certificate: "U",
    description: "A wedding party, a delayed train and one lost suitcase turn a 12-hour journey into a family reunion." },
  { title: "Shadow of the Fort", genre: ["Horror", "Mystery"], language: "Hindi", durationMins: 118, rating: 7.2, certificate: "A",
    description: "A heritage-hotel renovation uncovers a sealed room that nobody in the village will talk about." },
];

const theatres = [
  { theatre: "IMovies Cineplex", screen: "Screen 1", price: 250, rows: 8, cols: 10 },
  { theatre: "IMovies Cineplex", screen: "Screen 2 (Gold)", price: 400, rows: 6, cols: 8 },
  { theatre: "IMovies City Mall", screen: "Screen 3", price: 300, rows: 8, cols: 12 },
];
const slots = [[10, 30], [13, 45], [17, 0], [20, 30]];

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/imovies");
    await Promise.all([User.deleteMany(), Movie.deleteMany(), Show.deleteMany(), Booking.deleteMany()]);

    await User.create({ name: "Admin", email: "admin@imovies.com", password: "admin123", role: "admin" });
    await User.create({ name: "Demo User", email: "user@imovies.com", password: "user123" });

    const created = await Movie.insertMany(movies);

    const shows = [];
    created.forEach((movie, mi) => {
      for (let day = 0; day < 5; day++) {
        // spread movies over theatres/slots so every movie has a few shows each day
        const t = theatres[(mi + day) % theatres.length];
        const picks = [slots[(mi + day) % 4], slots[(mi + day + 2) % 4]];
        picks.forEach(([h, m]) => {
          const d = new Date();
          d.setDate(d.getDate() + day);
          d.setHours(h, m, 0, 0);
          if (d > new Date()) shows.push({ movie: movie._id, ...t, startTime: d });
        });
      }
    });
    await Show.insertMany(shows);

    console.log(`Seeded ${created.length} movies and ${shows.length} shows.`);
    console.log("Admin: admin@imovies.com / admin123");
    console.log("User:  user@imovies.com / user123");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
