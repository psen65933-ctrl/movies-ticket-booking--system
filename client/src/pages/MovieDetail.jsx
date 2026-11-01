import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errMsg, fmtDate, fmtTime, money } from "../api";
import Poster from "../components/Poster";

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [day, setDay] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get(`/movies/${id}`), api.get(`/shows?movie=${id}`)])
      .then(([m, s]) => {
        setMovie(m.data);
        setShows(s.data);
      })
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  // group by calendar day, then by theatre
  const days = useMemo(() => {
    const map = new Map();
    shows.forEach((s) => {
      const key = new Date(s.startTime).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return [...map.entries()];
  }, [shows]);

  const activeDay = day || days[0]?.[0];
  const dayShows = days.find(([k]) => k === activeDay)?.[1] || [];
  const byTheatre = dayShows.reduce((acc, s) => {
    (acc[s.theatre] = acc[s.theatre] || []).push(s);
    return acc;
  }, {});

  if (error) return <p className="error">{error}</p>;
  if (!movie) return <p>Loading…</p>;

  return (
    <>
      <div className="movie-head">
        <Poster movie={movie} className="poster poster-lg" />
        <div>
          <h1>{movie.title}</h1>
          <p className="muted">
            {movie.genre.join(" · ")} · {movie.language} · {Math.floor(movie.durationMins / 60)}h {movie.durationMins % 60}m ·{" "}
            <span className="tag">{movie.certificate}</span>
          </p>
          <p className="rating">★ {movie.rating.toFixed(1)} / 10</p>
          <p>{movie.description}</p>
        </div>
      </div>

      <h2>Showtimes</h2>
      {days.length === 0 ? (
        <p className="muted">No upcoming shows for this movie.</p>
      ) : (
        <>
          <div className="tabs">
            {days.map(([k, list]) => (
              <button key={k} className={k === activeDay ? "active" : ""} onClick={() => setDay(k)}>
                {fmtDate(list[0].startTime)}
              </button>
            ))}
          </div>
          {Object.entries(byTheatre).map(([theatre, list]) => (
            <div key={theatre} className="card theatre">
              <h3>{theatre}</h3>
              <div className="slots">
                {list.map((s) => {
                  const total = s.rows * s.cols;
                  const left = total - s.bookedSeats.length;
                  return (
                    <Link
                      key={s._id}
                      to={`/shows/${s._id}`}
                      className={`slot ${left === 0 ? "soldout" : ""}`}
                    >
                      <strong>{fmtTime(s.startTime)}</strong>
                      <small>{s.screen} · {money(s.price)}</small>
                      <small>{left === 0 ? "Sold out" : `${left} seats left`}</small>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
