import "../../styles/reviews.css";

function StarDisplay({ value, size = "1rem" }) {
  const number = Number(value) || 0;
  const rounded = Math.round(number);
  return (
    <span
      className="stars"
      style={{ fontSize: size }}
      role="img"
      aria-label={`${number.toLocaleString("es-AR", { maximumFractionDigits: 1 })} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? "star star-on" : "star"} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

export default StarDisplay;
