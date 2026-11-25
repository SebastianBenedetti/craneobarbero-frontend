import { useEffect, useState } from "react";
import { cancelAppointment, getCancellationPreview } from "../../services/appointments.services";
import "../../styles/appointmentModal.css";
import { backdropClose } from "../../utils/backdrop";

const money = (value) => `$${Number(value ?? 0).toLocaleString("es-AR")}`;

function CancelAppointmentModal({ appointment, askReason = false, onClose, onCancelled }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCancellationPreview(appointment.id)
      .then((data) => !cancelled && setPreview(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [appointment.id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const confirm = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await cancelAppointment(appointment.id, reason.trim() || undefined);
      onCancelled(updated);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" {...backdropClose(onClose)}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="cancel-title" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title" id="cancel-title">Cancelar turno</h3>

        {!preview && !error && <p className="modal-hint">Revisando el turno…</p>}

        {preview && (
          <>
            <p className="modal-hint">{preview.message}</p>
            {preview.refundable && (
              <p className="modal-hint text-info">Se reembolsan {money(preview.amount)} al medio de pago de Mercado Pago.</p>
            )}
            {!preview.refundable && preview.keptAmount > 0 && (
              <p className="modal-hint text-warning">El pago de {money(preview.keptAmount)} no se reembolsa.</p>
            )}
            {askReason && (
              <div className="modal-row">
                <label className="modal-label" htmlFor="cancel-reason">Motivo (opcional)</label>
                <input
                  id="cancel-reason"
                  className="modal-date-input"
                  maxLength={300}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Se le informa al cliente por mail"
                />
              </div>
            )}
          </>
        )}

        {error && <p className="modal-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button className="btn-agenda-cancel" onClick={confirm} disabled={!preview || saving}>
            {saving ? "Cancelando…" : "Sí, cancelar"}
          </button>
          <button className="modal-close" onClick={onClose}>
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelAppointmentModal;
