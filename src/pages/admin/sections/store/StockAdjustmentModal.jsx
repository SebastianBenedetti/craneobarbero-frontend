import { useState } from "react";
import { adjustStock } from "../../../../services/store.services";
import { backdropClose } from "../../../../utils/backdrop";
import { INPUT_CLASS } from "./shared";

function StockAdjustmentModal({ product, onClose, onSaved }) {
  const [direction, setDirection] = useState("subtract");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const amount = Number(quantity) || 0;
  const signed = direction === "add" ? amount : -amount;
  const resulting = product.stock + signed;

  const submit = async (e) => {
    e.preventDefault();
    if (amount <= 0) {
      setError("Ingresá una cantidad mayor a 0.");
      return;
    }
    if (resulting < 0) {
      setError("El stock no puede quedar negativo.");
      return;
    }
    setSaving(true);
    try {
      await adjustStock({ productId: product.id, quantity: signed, reason: reason.trim() });
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" {...backdropClose(onClose)}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="adjust-title">
        <h3 id="adjust-title" className="admin-modal-title">Ajustar stock · {product.name}</h3>
        <p className="text-secondary small">
          Los ajustes son para corregir diferencias (rotura, pérdida, conteo). Para cargar mercadería usá "Nueva compra".
        </p>
        <form onSubmit={submit}>
          <div className="store-segmented mb-3" role="radiogroup" aria-label="Tipo de ajuste">
            <button type="button" role="radio" aria-checked={direction === "subtract"} className={direction === "subtract" ? "active" : ""} onClick={() => setDirection("subtract")}>Restar</button>
            <button type="button" role="radio" aria-checked={direction === "add"} className={direction === "add" ? "active" : ""} onClick={() => setDirection("add")}>Sumar</button>
          </div>
          <div className="mb-3">
            <label htmlFor="adjust-qty" className="admin-form-label">Cantidad</label>
            <input id="adjust-qty" type="number" min="1" step="1" className={INPUT_CLASS} value={quantity} onChange={(e) => { setQuantity(e.target.value); setError(""); }} required />
            <p className="admin-form-hint">Stock actual: {product.stock} → queda en {resulting}</p>
          </div>
          <div className="mb-3">
            <label htmlFor="adjust-reason" className="admin-form-label">Motivo (opcional)</label>
            <input id="adjust-reason" className={INPUT_CLASS} value={reason} onChange={(e) => { setReason(e.target.value); setError(""); }} maxLength={300} placeholder="Ej.: frasco roto" />
          </div>
          {error && <p className="text-danger small" role="alert">{error}</p>}
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary w-100" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-warning text-dark w-100" disabled={saving}>{saving ? "Guardando..." : "Registrar ajuste"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockAdjustmentModal;
