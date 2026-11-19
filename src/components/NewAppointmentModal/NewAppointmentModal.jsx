import { useEffect, useState } from "react";
import useCuts from "../../hooks/useCuts";
import { PAYMENT_METHODS, createManualAppointment, getAvailableTimes, searchClients } from "../../services/appointments.services";
import { todayKey } from "../../utils/dates";
import "../../styles/appointmentModal.css";
import "../../styles/calendar.css";

const MIN_SEARCH = 3;

function NewAppointmentModal({ barbers, fixedBarber, onClose, onCreated }) {
  const cuts = useCuts();
  const [barberId, setBarberId] = useState(fixedBarber?.id ?? "");
  const [cutId, setCutId] = useState("");
  const [date, setDate] = useState(todayKey());
  const [startAt, setStartAt] = useState(null);
  const [times, setTimes] = useState({ key: null, list: [], error: "" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ key: "", list: [], error: "" });
  const [client, setClient] = useState(null);
  const [clientName, setClientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const timesKey = `${barberId}|${cutId}|${date}`;
  const ready = Boolean(barberId && cutId && date);
  const loadingTimes = ready && times.key !== timesKey;
  const trimmed = query.trim();

  useEffect(() => {
    if (!ready) return undefined;
    let cancelled = false;
    getAvailableTimes(barberId, cutId, date)
      .then((data) => !cancelled && setTimes({ key: timesKey, list: data.times ?? [], error: "" }))
      .catch((err) => !cancelled && setTimes({ key: timesKey, list: [], error: err.message }));
    return () => { cancelled = true; };
  }, [timesKey, ready, barberId, cutId, date]);

  useEffect(() => {
    if (trimmed.length < MIN_SEARCH || client) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      searchClients(trimmed)
        .then((list) => !cancelled && setResults({ key: trimmed, list, error: "" }))
        .catch((err) => !cancelled && setResults({ key: trimmed, list: [], error: err.message }));
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [trimmed, client]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const pickClient = (found) => {
    setClient(found);
    setClientName("");
    setQuery(found.name);
  };

  const save = async () => {
    if (!barberId || !cutId || !startAt) {
      setError("Elegí barbero, servicio, día y horario.");
      return;
    }
    if (!client && clientName.trim().length < 2) {
      setError("Elegí un cliente registrado o escribí el nombre de la persona.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const created = await createManualAppointment({
        barberId: Number(barberId),
        cutId: Number(cutId),
        appointmentDate: startAt,
        clientId: client?.id ?? null,
        clientName: client ? null : clientName.trim(),
        paymentMethod,
      });
      onCreated(created);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-wide" role="dialog" aria-modal="true" aria-labelledby="new-title" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title" id="new-title">Nuevo turno</h3>

        {fixedBarber ? (
          <div className="modal-row">
            <span className="modal-label">Barbero</span>
            <span>{fixedBarber.name}</span>
          </div>
        ) : (
          <div className="modal-row">
            <label className="modal-label" htmlFor="new-barber">Barbero</label>
            <select id="new-barber" className="modal-date-input" value={barberId}
              onChange={(e) => { setBarberId(e.target.value); setStartAt(null); }}>
              <option value="">Elegí un barbero</option>
              {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div className="modal-row">
          <label className="modal-label" htmlFor="new-cut">Servicio</label>
          <select id="new-cut" className="modal-date-input" value={cutId}
            onChange={(e) => { setCutId(e.target.value); setStartAt(null); }}>
            <option value="">Elegí un servicio</option>
            {cuts.map((c) => <option key={c.id} value={c.id}>{c.name} — ${Number(c.price).toLocaleString("es-AR")}</option>)}
          </select>
        </div>

        <div className="modal-row">
          <label className="modal-label" htmlFor="new-date">Día</label>
          <input id="new-date" type="date" className="modal-date-input" min={todayKey()} value={date}
            onChange={(e) => { setDate(e.target.value); setStartAt(null); }} />
        </div>

        {ready && loadingTimes && <p className="modal-hint">Cargando horarios…</p>}
        {ready && !loadingTimes && times.error && <p className="modal-error">{times.error}</p>}
        {ready && !loadingTimes && !times.error && times.list.length === 0 && (
          <p className="modal-hint">No hay horarios libres ese día para este servicio.</p>
        )}
        {ready && !loadingTimes && times.list.length > 0 && (
          <div className="booking-times mb-3" role="group" aria-label="Horarios disponibles">
            {times.list.map((slot) => (
              <button key={slot.startAt} type="button" aria-pressed={startAt === slot.startAt}
                className={`btn btn-sm ${startAt === slot.startAt ? "btn-warning text-dark fw-bold" : "btn-dark text-white"}`}
                onClick={() => setStartAt(slot.startAt)}>
                {slot.time}
              </button>
            ))}
          </div>
        )}

        <div className="modal-row modal-row-column">
          <label className="modal-label" htmlFor="new-client">Cliente registrado</label>
          <input id="new-client" className="modal-date-input" placeholder="Buscar por nombre (mínimo 3 letras)"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setClient(null); }} autoComplete="off" />
          {client && (
            <p className="modal-hint mb-0">
              Elegido: <strong>{client.name}</strong> ({client.maskedEmail}){" "}
              <button type="button" className="btn btn-link btn-sm p-0 text-warning"
                onClick={() => { setClient(null); setQuery(""); }}>
                Quitar
              </button>
            </p>
          )}
          {!client && trimmed.length > 0 && trimmed.length < MIN_SEARCH && (
            <p className="modal-hint mb-0">Escribí al menos {MIN_SEARCH} letras.</p>
          )}
          {!client && trimmed.length >= MIN_SEARCH && results.key === trimmed && (
            results.list.length === 0 ? (
              <p className="modal-hint mb-0">{results.error || "No hay clientes con ese nombre."}</p>
            ) : (
              <ul className="client-results">
                {results.list.map((found) => (
                  <li key={found.id}>
                    <button type="button" onClick={() => pickClient(found)}>
                      {found.name} <span className="text-secondary">· {found.maskedEmail}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>

        {!client && (
          <div className="modal-row">
            <label className="modal-label" htmlFor="new-name">O nombre (sin cuenta)</label>
            <input id="new-name" className="modal-date-input" maxLength={100} placeholder="Nombre de la persona"
              value={clientName} onChange={(e) => setClientName(e.target.value)} />
          </div>
        )}

        <div className="modal-row">
          <label className="modal-label" htmlFor="new-payment">Medio de pago</label>
          <select id="new-payment" className="modal-date-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        <p className="modal-hint">
          {client
            ? "El cliente recibe el mail de confirmación (sin enlace de pago)."
            : "Con un nombre sin cuenta no se envía ningún mail."}
        </p>

        {error && <p className="modal-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button className="btn-agenda-edit" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Crear turno"}
          </button>
          <button className="modal-close" onClick={onClose}>Volver</button>
        </div>
      </div>
    </div>
  );
}

export default NewAppointmentModal;
