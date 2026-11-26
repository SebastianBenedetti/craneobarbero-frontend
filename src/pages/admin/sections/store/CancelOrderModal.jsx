import { useState } from "react";
import { cancelOrder } from "../../../../services/store.services";
import { backdropClose } from "../../../../utils/backdrop";
import { formatMoney } from "../../../../utils/format";
import { INPUT_CLASS } from "./shared";

function CancelOrderModal({ order, onClose, onCancelled }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const wasPaid = order.status === "paid" || order.status === "ready";

  const submit = async (refund) => {
    setSaving(true);
    setError("");
    try {
      await cancelOrder(order.id, refund, reason.trim());
      onCancelled(refund);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" {...backdropClose(onClose)}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title">
        <h3 id="cancel-order-title" className="admin-modal-title">Cancelar pedido #{order.id}</h3>
        {wasPaid ? (
          <p className="text-secondary">
            El pedido está pago ({formatMoney(order.total)}). Al cancelarlo se repone el stock de sus productos.
            Elegí si se le devuelve el dinero al cliente por Mercado Pago.
          </p>
        ) : (
          <p className="text-secondary">El pedido todavía no se pagó: se cancela sin ningún movimiento de dinero.</p>
        )}

        <label htmlFor="cancel-order-reason" className="admin-form-label">Motivo (opcional)</label>
        <input
          id="cancel-order-reason"
          className={INPUT_CLASS}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
        />

        {error && <p className="text-danger small mt-2" role="alert">{error}</p>}

        <div className="d-flex flex-column gap-2 mt-4">
          {wasPaid && (
            <button className="btn btn-warning text-dark" onClick={() => submit(true)} disabled={saving}>
              Cancelar con reembolso
            </button>
          )}
          <button className="btn btn-danger" onClick={() => submit(false)} disabled={saving}>
            {wasPaid ? "Cancelar sin reembolso" : "Cancelar pedido"}
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Volver</button>
        </div>
      </div>
    </div>
  );
}

export default CancelOrderModal;
