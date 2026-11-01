import { Link } from "react-router-dom";
import Poster from "./Poster";

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie._id}`} className="movie-card">
      <Poster movie={movie} />
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p className="muted">{movie.genre.join(" · ")}</p>
        <div className="row-between">
          <span className="rating">★ {movie.rating.toFixed(1)}</span>
          <span className="tag">{movie.language}</span>
        </div>
      </div>
    </Link>
  );
}
