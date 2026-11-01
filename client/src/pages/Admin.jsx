import { useEffect, useState } from "react";
import api, { errMsg, fmtDate, fmtTime, money } from "../api";

const emptyMovie = { title: "", description: "", genre: "", language: "English", durationMins: "", rating: "", certificate: "UA", poster: "" };
const emptyShow = { movie: "", theatre: "IMovies Cineplex", screen: "Screen 1", startTime: "", price: "", rows: 8, cols: 10 };

export default function Admin() {
  const [tab, setTab] = useState("bookings");
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [showForm, setShowForm] = useState(emptyShow);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const [s, m, sh, b] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/movies"),
        api.get("/shows/all"),
        api.get("/admin/bookings"),
      ]);
      setStats(s.data);
      setMovies(m.data);
      setShows(sh.data);
      setBookings(b.data);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  useEffect(() => {
    load();
  }, []);

  const run = async (fn) => {
    setError("");
    try {
      await fn();
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const setM = (k) => (e) => setMovieForm({ ...movieForm, [k]: e.target.value });
  const setS = (k) => (e) => setShowForm({ ...showForm, [k]: e.target.value });

  const saveMovie = (e) => {
    e.preventDefault();
    run(async () => {
      const payload = {
        ...movieForm,
        genre: String(movieForm.genre).split(",").map((g) => g.trim()).filter(Boolean),
        durationMins: Number(movieForm.durationMins),
        rating: Number(movieForm.rating) || 0,
      };
      if (editingId) await api.put(`/movies/${editingId}`, payload);
      else await api.post("/movies", payload);
      setMovieForm(emptyMovie);
      setEditingId(null);
    });
  };

  const editMovie = (m) => {
    setEditingId(m._id);
    setMovieForm({ ...m, genre: m.genre.join(", ") });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveShow = (e) => {
    e.preventDefault();
    run(async () => {
      await api.post("/shows", {
        ...showForm,
        startTime: new Date(showForm.startTime).toISOString(),
        price: Number(showForm.price),
        rows: Number(showForm.rows),
        cols: Number(showForm.cols),
      });
      setShowForm({ ...emptyShow, movie: showForm.movie });
    });
  };

  const confirmThen = (msg, fn) => () => window.confirm(msg) && run(fn);

  return (
    <>
      <h2>Admin dashboard</h2>
      {error && <p className="error">{error}</p>}

      {stats && (
        <div className="stats">
          <div className="card"><small>Movies</small><h3>{stats.movies}</h3></div>
          <div className="card"><small>Upcoming shows</small><h3>{stats.upcomingShows}</h3></div>
          <div className="card"><small>Tickets sold</small><h3>{stats.tickets}</h3></div>
          <div className="card"><small>Revenue</small><h3>{money(stats.revenue)}</h3></div>
        </div>
      )}

      <div className="tabs">
        {["bookings", "movies", "shows"].map((t) => (
          <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "bookings" && (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>User</th><th>Movie</th><th>Show</th><th>Seats</th><th>Total</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td>{b.user?.name}<br /><small className="muted">{b.user?.email}</small></td>
                  <td>{b.show?.movie?.title || "—"}</td>
                  <td>{b.show ? `${fmtDate(b.show.startTime)}, ${fmtTime(b.show.startTime)}` : "—"}</td>
                  <td>{[...b.seats].sort().join(", ")}</td>
                  <td>{money(b.totalPrice)}</td>
                  <td><span className={`status ${b.status}`}>{b.status}</span></td>
                  <td>
                    {b.status === "confirmed" && (
                      <button className="btn btn-outline" onClick={confirmThen("Cancel this booking?", () => api.put(`/bookings/${b._id}/cancel`))}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <p className="muted">No bookings yet.</p>}
        </div>
      )}

      {tab === "movies" && (
        <>
          <form className="card admin-form" onSubmit={saveMovie}>
            <h3>{editingId ? "Edit movie" : "Add movie"}</h3>
            <div className="form-grid">
              <label>Title<input value={movieForm.title} onChange={setM("title")} required /></label>
              <label>Genres (comma separated)<input value={movieForm.genre} onChange={setM("genre")} /></label>
              <label>Language<input value={movieForm.language} onChange={setM("language")} /></label>
              <label>Duration (mins)<input type="number" min="1" value={movieForm.durationMins} onChange={setM("durationMins")} required /></label>
              <label>Rating (0-10)<input type="number" min="0" max="10" step="0.1" value={movieForm.rating} onChange={setM("rating")} /></label>
              <label>Certificate<input value={movieForm.certificate} onChange={setM("certificate")} /></label>
              <label>Poster URL (optional)<input value={movieForm.poster} onChange={setM("poster")} /></label>
            </div>
            <label>Description<textarea rows="3" value={movieForm.description} onChange={setM("description")} /></label>
            <div>
              <button className="btn">{editingId ? "Update movie" : "Add movie"}</button>{" "}
              {editingId && <button type="button" className="btn btn-outline" onClick={() => { setEditingId(null); setMovieForm(emptyMovie); }}>Cancel edit</button>}
            </div>
          </form>
          <div className="card table-wrap">
            <table>
              <thead><tr><th>Title</th><th>Genre</th><th>Language</th><th>Mins</th><th></th></tr></thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m._id}>
                    <td>{m.title}</td><td>{m.genre.join(", ")}</td><td>{m.language}</td><td>{m.durationMins}</td>
                    <td>
                      <button className="btn btn-outline" onClick={() => editMovie(m)}>Edit</button>{" "}
                      <button className="btn btn-danger" onClick={confirmThen("Delete this movie and its shows?", () => api.delete(`/movies/${m._id}`))}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "shows" && (
        <>
          <form className="card admin-form" onSubmit={saveShow}>
            <h3>Add show</h3>
            <div className="form-grid">
              <label>
                Movie
                <select value={showForm.movie} onChange={setS("movie")} required>
                  <option value="">Select…</option>
                  {movies.map((m) => <option key={m._id} value={m._id}>{m.title}</option>)}
                </select>
              </label>
              <label>Theatre<input value={showForm.theatre} onChange={setS("theatre")} required /></label>
              <label>Screen<input value={showForm.screen} onChange={setS("screen")} required /></label>
              <label>Start time<input type="datetime-local" value={showForm.startTime} onChange={setS("startTime")} required /></label>
              <label>Price per seat<input type="number" min="0" value={showForm.price} onChange={setS("price")} required /></label>
              <label>Rows<input type="number" min="1" max="26" value={showForm.rows} onChange={setS("rows")} /></label>
              <label>Seats per row<input type="number" min="1" max="30" value={showForm.cols} onChange={setS("cols")} /></label>
            </div>
            <div><button className="btn">Add show</button></div>
          </form>
          <div className="card table-wrap">
            <table>
              <thead><tr><th>Movie</th><th>Theatre</th><th>When</th><th>Price</th><th>Sold</th><th></th></tr></thead>
              <tbody>
                {shows.map((s) => (
                  <tr key={s._id}>
                    <td>{s.movie?.title}</td>
                    <td>{s.theatre} · {s.screen}</td>
                    <td>{fmtDate(s.startTime)}, {fmtTime(s.startTime)}</td>
                    <td>{money(s.price)}</td>
                    <td>{s.bookedSeats.length}/{s.rows * s.cols}</td>
                    <td><button className="btn btn-danger" onClick={confirmThen("Delete this show? Its bookings will be cancelled.", () => api.delete(`/shows/${s._id}`))}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
