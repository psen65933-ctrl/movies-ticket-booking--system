// Shows the poster image if there is one, otherwise a generated gradient with the title.
const hue = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

export default function Poster({ movie, className = "poster" }) {
  if (movie.poster) {
    return <div className={className} style={{ backgroundImage: `url(${movie.poster})` }} />;
  }
  const h = hue(movie.title);
  return (
    <div
      className={`${className} poster-gen`}
      style={{ background: `linear-gradient(160deg, hsl(${h} 70% 38%), hsl(${(h + 60) % 360} 70% 18%))` }}
    >
      <span>{movie.title}</span>
    </div>
  );
}
