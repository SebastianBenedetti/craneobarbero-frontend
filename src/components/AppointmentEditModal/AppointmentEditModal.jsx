import { useEffect, useState } from "react";
import { PAYMENT_METHODS, getAvailableTimes, rescheduleAppointment } from "../../services/appointments.services";
import { addDays, toDateKey, todayKey } from "../../utils/dates";
import "../../styles/appointmentModal.css";
import "../../styles/calendar.css";

const BOOKING_WINDOW_DAYS = 60;

function AppointmentEditModal({ appointment, staff = false, onClose, onSaved }) {
  const current = new Date(appointment.appointmentDate);
  const [date, setDate] = useState(toDateKey(current));
  const [selected, setSelected] = useState(null);
  const [times, setTimes] = useState({ key: null, list: [], error: "" });
  const isManual = appointment.createdByRole && appointment.createdByRole !== "client";
  const [paymentMethod, setPaymentMethod] = useState(appointment.paymentMethod ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const requestKey = `${appointment.barber?.id}|${appointment.cut?.id}|${date}`;
  const loading = Boolean(date) && times.key !== requestKey;

  useEffect(() => {
    if (!date || !appointment.barber?.id || !appointment.cut?.id) return undefined;
    let cancelled = false;
    getAvailableTimes(appointment.barber.id, appointment.cut.id, date)
      .then((data) => !cancelled && setTimes({ key: requestKey, list: data.times ?? [], error: "" }))
      .catch((err) => !cancelled && setTimes({ key: requestKey, list: [], error: err.message }));
    return () => { cancelled = true; };
  }, [requestKey, date, appointment.barber?.id, appointment.cut?.id]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const paymentChanged = staff && isManual && paymentMethod && paymentMethod !== appointment.paymentMethod;

  const save = async () => {
    if (!selected && !paymentChanged) {
      setError("Elegí un nuevo horario.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = { appointmentDate: selected ?? appointment.appointmentDate };
      if (paymentChanged) body.paymentMethod = paymentMethod;
      const updated = await rescheduleAppointment(appointment.id, body);
      onSaved(updated);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="edit-title" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title" id="edit-title">Modificar turno</h3>

        <div className="modal-row">
          <span className="modal-label">Servicio</span>
          <span>{appointment.cut?.name ?? "—"}</span>
        </div>
        <div className="modal-row">
          <span className="modal-label">Barbero</span>
          <span>{appointment.barber?.name ?? "—"}</span>
        </div>

        <div className="modal-row">
          <label className="modal-label" htmlFor="edit-date">Nueva fecha</label>
          <input
            id="edit-date"
            type="date"
            value={date}
            min={todayKey()}
            max={staff ? undefined : addDays(todayKey(), BOOKING_WINDOW_DAYS)}
            onChange={(e) => { setDate(e.target.value); setSelected(null); setError(""); }}
            className="modal-date-input"
          />
        </div>

        {loading && <p className="modal-hint">Cargando horarios…</p>}
        {!loading && times.error && <p className="modal-error">{times.error}</p>}
        {!loading && !times.error && date && times.list.length === 0 && (
          <p className="modal-hint">No hay horarios libres ese día. Probá con otra fecha.</p>
        )}
        {!loading && times.list.length > 0 && (
          <div className="booking-times mb-3" role="group" aria-label="Horarios disponibles">
            {times.list.map((slot) => (
              <button
                key={slot.startAt}
                type="button"
                aria-pressed={selected === slot.startAt}
                className={`btn btn-sm ${selected === slot.startAt ? "btn-warning text-dark fw-bold" : "btn-dark text-white"}`}
                onClick={() => { setSelected(slot.startAt); setError(""); }}
              >
                {slot.time}
              </button>
            ))}
          </div>
        )}

        {staff && isManual && (
          <div className="modal-row">
            <label className="modal-label" htmlFor="edit-payment">Medio de pago</label>
            <select id="edit-payment" className="modal-date-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        )}

        {error && <p className="modal-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button className="btn-agenda-edit" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambio"}
          </button>
          <button className="modal-close" onClick={onClose}>
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}

export default AppointmentEditModal;
