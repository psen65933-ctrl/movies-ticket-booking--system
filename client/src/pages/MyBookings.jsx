import { useEffect, useState } from "react";
import api, { errMsg, fmtDate, fmtTime, money } from "../api";
import Poster from "../components/Poster";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () =>
    api
      .get("/bookings/mine")
      .then((r) => setBookings(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      setError("");
      load();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (loading) return <p>Loading…</p>;

  return (
    <>
      <h2>My tickets</h2>
      {error && <p className="error">{error}</p>}
      {bookings.length === 0 && <p className="muted">No bookings yet.</p>}
      <div className="list">
        {bookings.map((b) => {
          const show = b.show;
          const upcoming = show && new Date(show.startTime) > new Date();
          return (
            <div key={b._id} className="card ticket">
              {show?.movie && <Poster movie={show.movie} className="poster poster-sm" />}
              <div className="ticket-body">
                <h3>{show?.movie?.title || "Show removed"}</h3>
                {show && (
                  <p className="muted">
                    {show.theatre} · {show.screen}
                    <br />
                    {fmtDate(show.startTime)}, {fmtTime(show.startTime)}
                  </p>
                )}
                <p>Seats: <strong>{[...b.seats].sort().join(", ")}</strong> · {money(b.totalPrice)}</p>
              </div>
              <div className="right">
                <span className={`status ${b.status}`}>{b.status}</span>
                {b.status === "confirmed" && upcoming && (
                  <button className="btn btn-outline" onClick={() => cancel(b._id)}>Cancel</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
