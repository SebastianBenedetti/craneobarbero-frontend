import { useEffect, useState } from "react";
import { formatMoney } from "../../utils/dates";
import "../../styles/appointmentModal.css";

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const TEXTS = {
  deactivate: {
    title: "Desactivar cuenta",
    own: "Tu cuenta queda desactivada: no vas a poder iniciar sesión y solo el local puede reactivarla. Se conserva todo tu historial de turnos.",
    admin: (name) => `La cuenta de ${name} queda desactivada: no puede iniciar sesión hasta que la reactives. Se conserva todo su historial.`,
    confirm: "Desactivar",
    busy: "Desactivando…",
  },
  delete: {
    title: "Eliminar cuenta",
    own: "Se borran tus datos personales de forma definitiva. Tus turnos pasados quedan guardados sin tu nombre, como \"Cliente eliminado\". Esta acción no se puede deshacer.",
    admin: (name) => `Se borran los datos personales de ${name} de forma definitiva. Sus turnos pasados quedan guardados como "Cliente eliminado". Esta acción no se puede deshacer.`,
    confirm: "Eliminar definitivamente",
    busy: "Eliminando…",
  },
};

function AccountClosureModal({ mode, subjectName, loadPreview, onConfirm, onClose, requirePassword = false }) {
  const texts = TEXTS[mode];
  const own = !subjectName;
  const [preview, setPreview] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPreview()
      .then((data) => !cancelled && setPreview(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => { cancelled = true; };
  }, [loadPreview]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !saving && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const submit = async (e) => {
    e.preventDefault();
    if (requirePassword && !password) {
      setError("Ingresá tu contraseña para confirmar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onConfirm(password);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const count = preview?.futureAppointments ?? 0;
  const notRefunded = preview ? preview.appointments.filter((a) => !a.refundable && a.paymentStatus === "paid") : [];

  return (
    <div className="modal-overlay" onClick={() => !saving && onClose()}>
      <form
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="closure-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h3 className="modal-title" id="closure-title">{texts.title}</h3>
        <p className="modal-hint">{own ? texts.own : texts.admin(subjectName)}</p>

        {!preview && !error && <p className="modal-hint">Revisando los turnos…</p>}

        {preview && count === 0 && (
          <p className="modal-hint">{own ? "No tenés turnos futuros." : "No tiene turnos futuros."}</p>
        )}

        {preview && count > 0 && (
          <>
            <p className="modal-hint text-warning">
              {count === 1 ? "Se va a cancelar 1 turno futuro:" : `Se van a cancelar ${count} turnos futuros:`}
            </p>
            <ul className="modal-hint" style={{ paddingLeft: "18px" }}>
              {preview.appointments.map((a) => (
                <li key={a.id}>
                  {formatDateTime(a.appointmentDate)} · {a.cutName} con {a.barberName}
                  {a.refundable && ` · se reembolsan ${formatMoney(a.refundAmount)}`}
                </li>
              ))}
            </ul>
            {preview.totalRefund > 0 && (
              <p className="modal-hint text-info">
                Total a reembolsar por Mercado Pago: {formatMoney(preview.totalRefund)}.
              </p>
            )}
            {notRefunded.length > 0 && (
              <p className="modal-hint text-warning">
                {notRefunded.length === 1 ? "Un turno pagado" : `${notRefunded.length} turnos pagados`} con menos de 4 horas
                de anticipación no se reembolsa{notRefunded.length === 1 ? "" : "n"}.
              </p>
            )}
          </>
        )}

        {requirePassword && (
          <div className="modal-row">
            <label className="modal-label" htmlFor="closure-password">Confirmá con tu contraseña</label>
            <input
              id="closure-password"
              type="password"
              autoComplete="current-password"
              className="modal-date-input"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
            />
          </div>
        )}

        {error && <p className="modal-error" role="alert">{error}</p>}

        <div className="modal-actions">
          <button type="submit" className="btn-agenda-cancel" disabled={!preview || saving}>
            {saving ? texts.busy : texts.confirm}
          </button>
          <button type="button" className="modal-close" onClick={onClose} disabled={saving}>
            Volver
          </button>
        </div>
      </form>
    </div>
  );
}

export default AccountClosureModal;
