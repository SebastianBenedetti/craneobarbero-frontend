import StarDisplay from "../StarRating/StarDisplay";
import "../../styles/reviews.css";

const formatDate = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

function ReviewList({ reviews, showBarber = false }) {
  if (reviews.length === 0) return <p className="text-secondary">Todavía no hay reseñas.</p>;
  return (
    <ul className="review-list">
      {reviews.map((review) => (
        <li key={review.id} className="review-card">
          <div>
            <strong className="text-light">{review.clientName}</strong>
            <span className="text-secondary small ms-2">
              {formatDate(review.appointmentDate)} · {review.cut.name}
              {showBarber && ` · ${review.barber.name}`} · {review.branch.name}
            </span>
          </div>
          <div className="review-card-ratings">
            <span>Barbero <StarDisplay value={review.ratingBarber} /></span>
            <span>Servicio <StarDisplay value={review.ratingCut} /></span>
          </div>
          {review.comment && <p className="review-card-comment">“{review.comment}”</p>}
        </li>
      ))}
    </ul>
  );
}

export default ReviewList;
