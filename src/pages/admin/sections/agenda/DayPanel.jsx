import { useEffect, useState } from "react";
import ConfirmModal from "../../../../components/ConfirmModal/ConfirmModal";
import { createHoliday, getAppointmentsOfDay, getScheduleDay, updateHoliday } from "../../../../services/schedule.services";
import { addMinutes, formatLongDate, todayKey } from "../../../../utils/dates";

const HOLIDAY_TYPES = {
  inamovible: "Feriado nacional",
  trasladable: "Feriado nacional",
  puente: "Día puente",
  custom: "Día no laborable propio",
};

const STATE_LABELS = { free: "Libre", busy: "Ocupado", deleted: "Eliminado" };

function HolidayBox({ date, holiday, onChanged, onError }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const past = date < todayKey();

  const run = async (action) => {
    setConfirm(null);
    setBusy(true);
    try {
      const result = await action();
      const parts = [];
      if (result.slotsRemoved > 0) parts.push(`se eliminaron ${result.slotsRemoved} horarios libres`);
      if (result.slotsKeptWithAppointments > 0) parts.push(`quedan ${result.slotsKeptWithAppointments} horarios con turnos (revisalos)`);
      if (result.slotsRestored > 0) parts.push(`se reabrieron ${result.slotsRestored} horarios`);
      onChanged(parts.length ? `Listo: ${parts.join(", ")}.` : "Listo.");
      setName("");
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (holiday) {
    return (
      <div className={`agenda-holiday ${holiday.isActive ? "" : "agenda-holiday-off"}`}>
        <div>
          <strong>{holiday.name}</strong>
          <span className="agenda-muted">
            {" · "}{HOLIDAY_TYPES[holiday.type] ?? "Feriado"}{holiday.isActive ? "" : " · desactivado (el día abre normal)"}
          </span>
          {holiday.appointmentsCount > 0 && (
            <p className="agenda-warning">Ese día hay {holiday.appointmentsCount} turno(s) cargados.</p>
          )}
        </div>
        {!past && (
          <button type="button" className="agenda-btn agenda-btn-outline" disabled={busy}
            onClick={() => setConfirm(holiday.isActive ? "off" : "on")}>
            {holiday.isActive ? "Abrir ese día" : "Volver a cerrarlo"}
          </button>
        )}
        {confirm && (
          <ConfirmModal
            title={confirm === "off" ? "Abrir el día" : "Cerrar el día"}
            message={confirm === "off"
              ? `"${holiday.name}" deja de ser no laborable: se cargan los horarios de atención de ese día para todos los barberos.`
              : `"${holiday.name}" vuelve a ser no laborable: se eliminan los horarios libres de ese día. Los que tienen turnos se mantienen.`}
            confirmLabel={confirm === "off" ? "Abrir" : "Cerrar"}
            confirmClass="agenda-btn"
            onConfirm={() => run(() => updateHoliday(holiday.id, holiday.name, confirm === "on"))}
            onCancel={() => setConfirm(null)}
          />
        )}
      </div>
    );
  }

  if (past) return null;

  return (
    <form className="agenda-holiday agenda-holiday-new"
      onSubmit={(e) => { e.preventDefault(); if (name.trim().length >= 3) setConfirm("create"); else onError("Escribí el motivo (al menos 3 caracteres)."); }}>
      <label className="agenda-field agenda-grow">
        <span>Marcar como día no laborable</span>
        <input className="agenda-input" maxLength={150} placeholder="Motivo, ej.: Cerrado por inventario"
          value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <button type="submit" className="agenda-btn agenda-btn-outline" disabled={busy}>Cerrar el día</button>
      {confirm === "create" && (
        <ConfirmModal
          title="Cerrar el día"
          message={`El ${formatLongDate(date)} queda como no laborable en todas las sucursales: se eliminan los horarios libres. Los horarios con turnos se mantienen.`}
          confirmLabel="Cerrar el día"
          confirmClass="agenda-btn"
          onConfirm={() => run(() => createHoliday(date, name.trim()))}
          onCancel={() => setConfirm(null)}
        />
      )}
    </form>
  );
}

function DayPanel({ date, barbers, branchesById, holiday, refreshKey, onOperate, onHolidayChanged, onError, onClose }) {
  const [detail, setDetail] = useState({ key: null, rows: [], appointments: {} });
  const [error, setError] = useState("");
  const past = date < todayKey();
  const requestKey = `${date}|${barbers.map((b) => b.id).join(",")}|${refreshKey}`;
  const loading = detail.key !== requestKey && !error;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      Promise.all(barbers.map((b) => getScheduleDay(date, b.id).then((d) => ({ barber: b, slots: d.slots })))),
      getAppointmentsOfDay(date),
    ])
      .then(([rows, appointments]) => {
        if (cancelled) return;
        setError("");
        setDetail({ key: requestKey, rows, appointments: Object.fromEntries(appointments.map((a) => [a.id, a])) });
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [requestKey, date, barbers]);

  return (
    <aside className="agenda-day-panel" aria-label={`Detalle del ${formatLongDate(date)}`}>
      <div className="agenda-day-panel-header">
        <h3 className="agenda-day-panel-title">{formatLongDate(date)}</h3>
        <button type="button" className="agenda-close" onClick={onClose} aria-label="Cerrar detalle">✕</button>
      </div>

      <HolidayBox date={date} holiday={holiday} onChanged={onHolidayChanged} onError={onError} />

      {!past && (
        <div className="agenda-day-actions">
          <button type="button" className="agenda-btn agenda-btn-outline" onClick={() => onOperate("add", { dateFrom: date })}>
            + Agregar horarios este día
          </button>
          <button type="button" className="agenda-btn agenda-btn-outline agenda-btn-outline-danger" onClick={() => onOperate("remove", { dateFrom: date })}>
            Eliminar horarios este día
          </button>
        </div>
      )}

      {error && <p className="agenda-error" role="alert">{error}</p>}
      {loading && <p className="agenda-muted">Cargando horarios…</p>}
      {!loading && barbers.length === 0 && <p className="agenda-muted">Elegí al menos una sucursal para ver los horarios.</p>}

      {!loading && detail.rows.map(({ barber, slots }) => (
        <div key={barber.id} className="agenda-barber-day">
          <div className="agenda-barber-day-header">
            <strong>{barber.name}</strong>
            <span className="agenda-muted"> · {branchesById[barber.branchId]?.name ?? ""}</span>
            <span className="agenda-muted agenda-right">
              {slots.filter((s) => s.state === "free").length} libres · {slots.filter((s) => s.state === "busy").length} ocupados
            </span>
          </div>
          {slots.length === 0 ? (
            <p className="agenda-muted agenda-small">Sin horarios este día.</p>
          ) : (
            <ul className="agenda-slots">
              {slots.map((slot) => {
                const appointment = slot.appointmentId ? detail.appointments[slot.appointmentId] : null;
                return (
                  <li key={slot.id} className={`agenda-slot agenda-slot-${slot.state}`}>
                    <span className="agenda-slot-time">{slot.time}</span>
                    <span className="agenda-slot-info">
                      {STATE_LABELS[slot.state] ?? slot.state}
                      {slot.origin === "manual" && slot.state !== "deleted" && " · agregado a mano"}
                      {appointment && ` · ${appointment.client?.name ?? appointment.clientName ?? "Cliente"} · ${appointment.cut?.name ?? ""}`}
                      {slot.state === "deleted" && slot.deleteReason && ` · ${slot.deleteReason === "holiday" ? "feriado" : slot.deleteReason}`}
                    </span>
                    {!past && slot.state === "free" && (
                      <button type="button" className="agenda-slot-btn agenda-slot-btn-danger"
                        aria-label={`Eliminar ${slot.time} de ${barber.name}`}
                        onClick={() => onOperate("remove", { dateFrom: date, timeFrom: slot.time, timeTo: addMinutes(slot.time, 30) }, barber)}>
                        Eliminar
                      </button>
                    )}
                    {!past && slot.state === "deleted" && (
                      <button type="button" className="agenda-slot-btn"
                        aria-label={`Volver a agregar ${slot.time} de ${barber.name}`}
                        onClick={() => onOperate("add", { dateFrom: date, timeFrom: slot.time, timeTo: addMinutes(slot.time, 30) }, barber)}>
                        Volver a agregar
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ))}
    </aside>
  );
}

export default DayPanel;
