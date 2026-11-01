import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { errMsg, fmtDate, fmtTime, money } from "../api";
import { useAuth } from "../AuthContext";

const MAX_SEATS = 8;

export default function SeatSelection() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [show, setShow] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .get(`/shows/${id}`)
      .then((r) => setShow(r.data))
      .catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
  }, [id]);

  if (!show) return error ? <p className="error">{error}</p> : <p>Loading…</p>;

  const taken = new Set(show.bookedSeats);
  const rowLetters = Array.from({ length: show.rows }, (_, i) => String.fromCharCode(65 + i));
  const started = new Date(show.startTime) <= new Date();

  const toggle = (seat) => {
    if (taken.has(seat) || started) return;
    setError("");
    setSelected((cur) => {
      if (cur.includes(seat)) return cur.filter((s) => s !== seat);
      if (cur.length >= MAX_SEATS) {
        setError(`You can select up to ${MAX_SEATS} seats`);
        return cur;
      }
      return [...cur, seat];
    });
  };

  const book = async () => {
    if (!user) return navigate("/login", { state: { from: `/shows/${id}` } });
    setBusy(true);
    setError("");
    try {
      await api.post("/bookings", { showId: id, seats: selected });
      navigate("/my-bookings");
    } catch (e) {
      setError(errMsg(e));
      setSelected([]);
      load(); // refresh seat map in case someone else took a seat
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2>{show.movie.title}</h2>
      <p className="muted">
        {show.theatre} · {show.screen} · {fmtDate(show.startTime)}, {fmtTime(show.startTime)} · {money(show.price)} per seat
      </p>

      <div className="card seat-wrap">
        <div className="screen">SCREEN THIS WAY</div>
        <div className="seat-grid">
          {rowLetters.map((r) => (
            <div key={r} className="seat-row">
              <span className="row-label">{r}</span>
              {Array.from({ length: show.cols }, (_, i) => {
                const seat = `${r}${i + 1}`;
                const cls = taken.has(seat) ? "taken" : selected.includes(seat) ? "selected" : "free";
                return (
                  <button
                    key={seat}
                    className={`seat ${cls}`}
                    onClick={() => toggle(seat)}
                    disabled={taken.has(seat) || started}
                    title={seat}
                    aria-label={`Seat ${seat} ${cls}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="legend">
          <span><i className="seat free" /> Available</span>
          <span><i className="seat selected" /> Selected</span>
          <span><i className="seat taken" /> Booked</span>
        </div>
      </div>

      <div className="card checkout">
        <div>
          {selected.length === 0 ? (
            <span className="muted">Select your seats</span>
          ) : (
            <>
              <strong>{[...selected].sort().join(", ")}</strong>
              <br />
              <span className="muted">{selected.length} ticket{selected.length > 1 ? "s" : ""}</span>
            </>
          )}
        </div>
        <div className="right">
          <h3>{money(selected.length * show.price)}</h3>
          <button className="btn" disabled={busy || selected.length === 0 || started} onClick={book}>
            {started ? "Show started" : busy ? "Booking…" : user ? "Confirm booking" : "Login to book"}
          </button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
    </>
  );
}
