import { useState } from "react";
import StarRating from "../StarRating/StarRating";
import { createReview } from "../../services/reviews.services";
import { backdropClose } from "../../utils/backdrop";
import "../../styles/adminDashboard.css";

const MAX_COMMENT = 500;

function ReviewModal({ appointment, onClose, onSaved }) {
  const [ratingBarber, setRatingBarber] = useState(0);
  const [ratingCut, setRatingCut] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!ratingBarber || !ratingCut) {
      setError("Calificá al barbero y al servicio con 1 a 5 estrellas.");
      return;
    }
    setSaving(true);
    try {
      const review = await createReview(appointment.id, { ratingBarber, ratingCut, comment: comment.trim() || null });
      onSaved(review);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" {...backdropClose(onClose)}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <h3 id="review-title" className="admin-modal-title">Calificá tu turno</h3>
        <p className="text-secondary small">
          {appointment.cut?.name} con {appointment.barber?.name}. Solo se puede calificar una vez.
        </p>
        <form onSubmit={submit}>
          <StarRating
            id="rating-barber"
            label={`Barbero: ${appointment.barber?.name ?? ""}`}
            value={ratingBarber}
            onChange={(v) => { setRatingBarber(v); setError(""); }}
          />
          <StarRating
            id="rating-cut"
            label={`Servicio: ${appointment.cut?.name ?? ""}`}
            value={ratingCut}
            onChange={(v) => { setRatingCut(v); setError(""); }}
          />
          <label htmlFor="review-comment" className="admin-form-label mt-2">Comentario (opcional)</label>
          <textarea
            id="review-comment"
            rows={3}
            className="form-control bg-secondary text-white border-secondary"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={MAX_COMMENT}
            placeholder="Contanos cómo te fue"
          />
          <p className="admin-form-hint text-end">{comment.length}/{MAX_COMMENT}</p>
          {error && <p className="text-danger small" role="alert">{error}</p>}
          <div className="d-flex gap-2 mt-3">
            <button type="button" className="btn btn-outline-secondary w-100" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-warning text-dark w-100" disabled={saving}>
              {saving ? "Enviando..." : "Enviar calificación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReviewModal;
