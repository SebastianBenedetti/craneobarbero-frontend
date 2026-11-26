import { useState } from "react";
import "../../styles/reviews.css";

const LABELS = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

function StarRating({ id, label, value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="star-input">
      <span id={`${id}-label`} className="admin-form-label d-block">{label}</span>
      <div className="star-input-row" role="radiogroup" aria-labelledby={`${id}-label`} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"} (${LABELS[n]})`}
            className={n <= shown ? "star-button star-on" : "star-button"}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ))}
        <span className="star-input-text">{shown ? LABELS[shown] : "Elegí de 1 a 5"}</span>
      </div>
    </div>
  );
}

export default StarRating;
