import { useState } from "react";
import ConfirmModal from "../../../../components/ConfirmModal/ConfirmModal";
import { addSlots, previewAddSlots, previewRemoveSlots, removeSlots } from "../../../../services/schedule.services";
import { WEEKDAYS, formatMoney, formatShortDate, timeOptions, toDateKey, todayKey } from "../../../../utils/dates";

const FROM_TIMES = timeOptions(6, 23);
const TO_TIMES = timeOptions(6, 23).slice(1).concat("23:30");

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const rangeText = (from, to) =>
  from === to ? `el ${formatShortDate(from)}` : `entre el ${formatShortDate(from)} y el ${formatShortDate(to)}`;

const describeError = (err) => {
  const details = err.errors ? Object.values(err.errors).flat() : [];
  return details.length > 0 ? details.join(" ") : err.message;
};

function SlotOperationForm({ mode, initial, scope, scopeLabel, onDone, onCancel }) {
  const isRemove = mode === "remove";
  const [form, setForm] = useState({
    dateFrom: initial?.dateFrom ?? todayKey(),
    dateTo: initial?.dateTo ?? initial?.dateFrom ?? todayKey(),
    wholeDay: !initial?.timeFrom,
    timeFrom: initial?.timeFrom ?? "09:00",
    timeTo: initial?.timeTo ?? "13:00",
    weekdays: [],
    reason: "",
  });
  const [preview, setPreview] = useState(null);
  const [cancelAffected, setCancelAffected] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const update = (changes) => {
    setForm((f) => ({ ...f, ...changes }));
    setPreview(null);
    setCancelAffected(null);
    setError("");
  };

  const toggleWeekday = (key) =>
    update({ weekdays: form.weekdays.includes(key) ? form.weekdays.filter((w) => w !== key) : [...form.weekdays, key] });

  const buildBody = () => ({
    ...scope,
    dateFrom: form.dateFrom,
    dateTo: form.dateTo,
    timeFrom: form.wholeDay ? null : form.timeFrom,
    timeTo: form.wholeDay ? null : form.timeTo,
    weekdays: form.weekdays.length > 0 ? form.weekdays : null,
  });

  const validate = () => {
    if (!form.dateFrom || !form.dateTo) return "Completá las fechas.";
    if (form.dateFrom < todayKey()) return "No se puede operar sobre fechas pasadas.";
    if (form.dateTo < form.dateFrom) return "La fecha final no puede ser anterior a la inicial.";
    if (!form.wholeDay && form.timeTo <= form.timeFrom) return "La hora de fin tiene que ser posterior a la de inicio.";
    if (isRemove && form.reason.trim().length < 3) return "Escribí el motivo (al menos 3 caracteres).";
    if (!scope.allBranches && (scope.branchIds?.length ?? 0) === 0) return "Elegí al menos una sucursal.";
    return "";
  };

  const runPreview = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = isRemove ? await previewRemoveSlots(buildBody()) : await previewAddSlots(buildBody());
      setPreview(result);
      setCancelAffected(isRemove && result.affectedCount === 0 ? false : null);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  const summary = () => {
    if (!preview) return "";
    if (!isRemove) {
      return `Los horarios que ya están cargados se saltean y no se modifican. Se van a crear ${preview.toCreate}, restaurar ${preview.toRestore} y saltear ${preview.toSkip} (${plural(preview.barbers, "barbero", "barberos")} de ${plural(preview.branches, "sucursal", "sucursales")}, ${rangeText(form.dateFrom, form.dateTo)}).`;
    }
    const kept = cancelAffected ? 0 : preview.slotsWithAppointments;
    const removed = preview.slotsToRemove - kept;
    let text = `Se eliminarán ${plural(removed, "horario", "horarios")} de ${plural(preview.branches, "sucursal", "sucursales")} ${rangeText(form.dateFrom, form.dateTo)}.`;
    if (cancelAffected) {
      text += ` Se cancelarán ${plural(preview.affectedCount, "turno", "turnos")} y se reembolsará ${formatMoney(preview.totalRefund)}.`;
    } else if (kept > 0) {
      text += ` Se mantienen ${plural(kept, "horario ocupado", "horarios ocupados")} con sus turnos.`;
    }
    return text;
  };

  const nothingToDo = preview && (isRemove ? preview.slotsToRemove === 0 : preview.toCreate + preview.toRestore === 0);

  const apply = async () => {
    setConfirming(false);
    setBusy(true);
    setError("");
    try {
      if (isRemove) {
        const result = await removeSlots({
          ...buildBody(),
          reason: form.reason.trim(),
          cancelAffected: Boolean(cancelAffected),
          expectedCancellations: cancelAffected ? preview.affectedCount : null,
        });
        let message = `Se eliminaron ${plural(result.removed, "horario", "horarios")}.`;
        if (result.keptWithAppointments > 0) message += ` Se mantuvieron ${result.keptWithAppointments} con turnos.`;
        if (result.cancelledAppointments > 0) {
          message += ` Se cancelaron ${plural(result.cancelledAppointments, "turno", "turnos")}`;
          message += result.refunded > 0 ? ` y se reembolsaron ${formatMoney(result.totalRefunded)}.` : ".";
        }
        onDone(message);
      } else {
        const result = await addSlots(buildBody());
        onDone(`Se crearon ${result.created}, se restauraron ${result.restored} y se saltearon ${result.skipped} horarios.`);
      }
    } catch (err) {
      setError(describeError(err));
      if (err.code === "preview_outdated") {
        setPreview(null);
        setCancelAffected(null);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="agenda-form" aria-label={isRemove ? "Eliminar horarios" : "Agregar horarios"}>
      <div className="agenda-form-header">
        <h3 className="agenda-form-title">{isRemove ? "Eliminar horarios" : "Agregar horarios"}</h3>
        <button type="button" className="agenda-link-btn" onClick={onCancel}>
          ← Volver
        </button>
      </div>
      <p className="agenda-hint">
        Se aplica a: <strong>{scopeLabel}</strong>.{" "}
        {isRemove
          ? "Solo se eliminan horarios que están abiertos. Si hay turnos, vas a poder elegir mantenerlos o cancelarlos."
          : "Solo se agregan horarios que no están abiertos; lo ya cargado no se toca. Podés agregar fuera del horario de atención (domingos, feriados, horario extendido)."}
      </p>

      <div className="agenda-form-row">
        <label className="agenda-field">
          <span>Desde</span>
          <input type="date" className="agenda-input" min={todayKey()} value={form.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value, dateTo: e.target.value > form.dateTo ? e.target.value : form.dateTo })} />
        </label>
        <label className="agenda-field">
          <span>Hasta</span>
          <input type="date" className="agenda-input" min={form.dateFrom} value={form.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })} />
        </label>
      </div>

      <fieldset className="agenda-fieldset">
        <legend>Horario</legend>
        <label className="agenda-check">
          <input type="radio" name={`${mode}-span`} checked={form.wholeDay} onChange={() => update({ wholeDay: true })} />
          {isRemove ? "Todo el día" : "Horario de atención del día"}
        </label>
        <label className="agenda-check">
          <input type="radio" name={`${mode}-span`} checked={!form.wholeDay} onChange={() => update({ wholeDay: false })} />
          Una franja
        </label>
        {!form.wholeDay && (
          <div className="agenda-form-row">
            <label className="agenda-field">
              <span>De</span>
              <select className="agenda-input" value={form.timeFrom} onChange={(e) => update({ timeFrom: e.target.value })}>
                {FROM_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label className="agenda-field">
              <span>A</span>
              <select className="agenda-input" value={form.timeTo} onChange={(e) => update({ timeTo: e.target.value })}>
                {TO_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
          </div>
        )}
        {!isRemove && form.wholeDay && (
          <p className="agenda-muted agenda-small">Con esta opción un domingo o un feriado no agrega nada: para abrir esos días elegí una franja.</p>
        )}
      </fieldset>

      {form.dateFrom !== form.dateTo && (
        <fieldset className="agenda-fieldset">
          <legend>Días de la semana <span className="agenda-muted">(opcional; sin marcar = todos)</span></legend>
          <div className="agenda-chips">
            {WEEKDAYS.map((w) => (
              <button key={w.key} type="button"
                className={`agenda-chip ${form.weekdays.includes(w.key) ? "agenda-chip-active" : ""}`}
                aria-pressed={form.weekdays.includes(w.key)} onClick={() => toggleWeekday(w.key)}>
                {w.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {isRemove && (
        <label className="agenda-field">
          <span>Motivo (obligatorio)</span>
          <input className="agenda-input" maxLength={300} placeholder="Ej.: la sucursal no abre por refacciones"
            value={form.reason} onChange={(e) => update({ reason: e.target.value })} />
        </label>
      )}

      {error && <p className="agenda-error" role="alert">{error}</p>}

      {preview && (
        <div className="agenda-preview" aria-live="polite">
          {isRemove && preview.affectedCount > 0 && (
            <>
              <p className="agenda-preview-title">
                Hay {plural(preview.affectedCount, "turno afectado", "turnos afectados")}
                {preview.totalRefund > 0 && ` (reembolso total posible: ${formatMoney(preview.totalRefund)})`}
              </p>
              <ul className="agenda-affected">
                {preview.affectedAppointments.map((a) => (
                  <li key={a.id}>
                    <strong>{formatShortDate(toDateKey(new Date(a.appointmentDate)))} {a.time}</strong>
                    {" · "}{a.clientName} · {a.cutName} · {a.barberName}
                    {" · "}{a.status === "awaiting_payment" ? "esperando pago" : a.paymentStatus === "paid" ? "abonado" : "pendiente de abonar"}
                    {a.refundable && ` · se reembolsan ${formatMoney(a.price)}`}
                  </li>
                ))}
              </ul>
              <fieldset className="agenda-fieldset">
                <legend>¿Qué hacemos con esos turnos?</legend>
                <label className="agenda-check">
                  <input type="radio" name="affected" checked={cancelAffected === false} onChange={() => setCancelAffected(false)} />
                  Mantenerlos (se eliminan solo los horarios libres)
                </label>
                <label className="agenda-check">
                  <input type="radio" name="affected" checked={cancelAffected === true} onChange={() => setCancelAffected(true)} />
                  Cancelarlos (con reembolso total si se pagaron online)
                </label>
              </fieldset>
            </>
          )}
          {nothingToDo ? (
            <p className="agenda-muted">
              {isRemove ? "No hay horarios abiertos para eliminar con esos filtros." : "Todos esos horarios ya están abiertos: no hay nada para agregar."}
            </p>
          ) : (
            (cancelAffected !== null || !isRemove) && <p className="agenda-preview-summary">{summary()}</p>
          )}
        </div>
      )}

      <div className="agenda-form-actions">
        {!preview ? (
          <button type="button" className="agenda-btn" onClick={runPreview} disabled={busy}>
            {busy ? "Analizando…" : "Revisar"}
          </button>
        ) : (
          <button type="button" className={`agenda-btn ${isRemove ? "agenda-btn-danger" : ""}`}
            onClick={() => setConfirming(true)} disabled={busy || nothingToDo || (isRemove && cancelAffected === null)}>
            {busy ? "Aplicando…" : isRemove ? "Eliminar" : "Agregar"}
          </button>
        )}
      </div>

      {confirming && (
        <ConfirmModal
          title={isRemove ? "Confirmar eliminación" : "Confirmar carga"}
          message={summary()}
          confirmLabel={isRemove ? "Eliminar" : "Agregar"}
          confirmClass={isRemove ? "agenda-btn agenda-btn-danger" : "agenda-btn"}
          onConfirm={apply}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  );
}

export default SlotOperationForm;
