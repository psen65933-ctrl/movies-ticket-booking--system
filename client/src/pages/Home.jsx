import { useEffect, useState } from "react";
import api, { errMsg } from "../api";
import MovieCard from "../components/MovieCard";

const GENRES = ["Action", "Comedy", "Drama", "Family", "Horror", "Mystery", "Romance", "Sci-Fi", "Thriller", "Adventure"];

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // small debounce so we don't query on every keystroke
    const t = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (genre) params.set("genre", genre);
      if (language) params.set("language", language);
      api
        .get(`/movies?${params}`)
        .then((r) => { setMovies(r.data); setError(""); })
        .catch((e) => setError(errMsg(e)))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search, genre, language]);

  return (
    <>
      <section className="hero">
        <h1>Movie tickets, made simple.</h1>
        <p>Pick a movie, choose your seats, done.</p>
        <input
          className="hero-search"
          placeholder="Search movies…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      <div className="filters">
        <select value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="">All genres</option>
          {GENRES.map((g) => <option key={g}>{g}</option>)}
        </select>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="">All languages</option>
          {["English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada"].map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>

      <h2>Now showing</h2>
      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading movies…</p>
      ) : movies.length === 0 ? (
        <p className="muted">No movies found.</p>
      ) : (
        <div className="grid">{movies.map((m) => <MovieCard key={m._id} movie={m} />)}</div>
      )}
    </>
  );
}
