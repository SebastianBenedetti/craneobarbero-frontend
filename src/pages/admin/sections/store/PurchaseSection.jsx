import { useEffect, useState } from "react";
import ConfirmModal from "../../../../components/ConfirmModal/ConfirmModal";
import { getProducts, registerPurchase } from "../../../../services/store.services";
import { formatMoney } from "../../../../utils/format";
import { todayKey } from "../../../../utils/dates";
import { INPUT_CLASS, SELECT_CLASS, textOrNull } from "./shared";
import SupplierFormModal from "./SupplierFormModal";

const emptyLine = () => ({ key: crypto.randomUUID(), productId: "", quantity: "", unitCost: "" });

function PurchaseSection({ suppliers, draft, onSuppliersChanged, onDone }) {
  const [products, setProducts] = useState([]);
  const [supplierId, setSupplierId] = useState(draft?.supplierId ?? "");
  const [documentNumber, setDocumentNumber] = useState("");
  const [date, setDate] = useState(todayKey());
  const [lines, setLines] = useState(() => (draft?.lines?.length ? draft.lines : [emptyLine()]));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [addingSupplier, setAddingSupplier] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    getProducts({ active: "" }).then(setProducts).catch((err) => setError(err.message));
  }, []);

  const productById = (id) => products.find((p) => p.id === Number(id));

  const updateLine = (key, field, value) => {
    setLines((prev) => prev.map((line) => {
      if (line.key !== key) return line;
      const next = { ...line, [field]: value };
      if (field === "productId" && line.unitCost === "") {
        const product = productById(value);
        if (product) next.unitCost = product.cost;
      }
      return next;
    }));
    setError("");
  };

  const removeLine = (key) => setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));

  const filled = lines.filter((l) => l.productId);
  const total = filled.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitCost) || 0), 0);
  const usedIds = new Set(filled.map((l) => Number(l.productId)));

  const validate = () => {
    if (filled.length === 0) return "Agregá al menos un producto.";
    if (filled.some((l) => !(Number(l.quantity) > 0))) return "Cada línea necesita una cantidad mayor a 0.";
    if (filled.some((l) => l.unitCost === "" || Number(l.unitCost) < 0)) return "Cada línea necesita el costo unitario.";
    if (usedIds.size !== filled.length) return "No repitas el mismo producto en dos líneas.";
    if (date > todayKey()) return "La fecha no puede ser futura.";
    return "";
  };

  const askConfirm = (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) setError(problem);
    else setConfirming(true);
  };

  const submit = async () => {
    setConfirming(false);
    setSaving(true);
    try {
      const response = await registerPurchase({
        supplierId: supplierId ? Number(supplierId) : null,
        documentNumber: textOrNull(documentNumber),
        date,
        items: filled.map((l) => ({ productId: Number(l.productId), quantity: Number(l.quantity), unitCost: Number(l.unitCost) })),
      });
      setResult(response);
      setLines([emptyLine()]);
      setDocumentNumber("");
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const activeSuppliers = suppliers.filter((s) => s.isActive);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Nueva compra</h2>
      </div>
      <p className="text-secondary small">
        Suma el stock y el costo unitario pasa a ser el costo vigente del producto. Un error se corrige después con un ajuste de stock.
      </p>

      {result && (
        <div className="alert alert-success" role="status">
          Compra registrada por {formatMoney(result.total)}
          {result.supplier ? ` a ${result.supplier.name}` : ""}.
          <ul className="mb-0 mt-2 small">
            {result.items.map((item) => (
              <li key={item.movementId}>
                {item.productName}: +{item.quantity} (stock {item.stockAfter}); costo {formatMoney(item.previousCost)} → {formatMoney(item.newCost)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={askConfirm}>
        <div className="store-form-grid store-form-grid-3 mb-3">
          <div>
            <label htmlFor="purchase-date" className="admin-form-label">Fecha</label>
            <input id="purchase-date" type="date" className={INPUT_CLASS} value={date} max={todayKey()} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="purchase-supplier" className="admin-form-label">Proveedor</label>
            <div className="d-flex gap-2">
              <select id="purchase-supplier" className={SELECT_CLASS} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                <option value="">Sin proveedor</option>
                {activeSuppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="button" className="btn btn-outline-warning" onClick={() => setAddingSupplier(true)} aria-label="Agregar proveedor" title="Agregar proveedor">+</button>
            </div>
          </div>
          <div>
            <label htmlFor="purchase-doc" className="admin-form-label">N.º de comprobante</label>
            <input id="purchase-doc" className={INPUT_CLASS} value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} maxLength={50} placeholder="Opcional" />
          </div>
        </div>

        <div className="store-lines">
          {lines.map((line, index) => {
            const product = productById(line.productId);
            const changesCost = product && line.unitCost !== "" && Number(line.unitCost) !== Number(product.cost);
            return (
              <div key={line.key} className="store-line">
                <div className="store-line-product">
                  <label htmlFor={`line-product-${line.key}`} className="admin-form-label">Producto {index + 1}</label>
                  <select id={`line-product-${line.key}`} className={SELECT_CLASS} value={line.productId} onChange={(e) => updateLine(line.key, "productId", e.target.value)}>
                    <option value="">Elegí un producto</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={usedIds.has(p.id) && Number(line.productId) !== p.id}>
                        {p.name}{p.isActive ? "" : " (desactivado)"}
                      </option>
                    ))}
                  </select>
                  {product && (
                    <span className="admin-form-hint">
                      Stock {product.stock} · costo vigente {formatMoney(product.cost)}
                      {changesCost && <> → nuevo costo <strong className="text-warning">{formatMoney(line.unitCost)}</strong></>}
                    </span>
                  )}
                </div>
                <div>
                  <label htmlFor={`line-qty-${line.key}`} className="admin-form-label">Cantidad</label>
                  <input id={`line-qty-${line.key}`} type="number" min="1" step="1" className={INPUT_CLASS} value={line.quantity} onChange={(e) => updateLine(line.key, "quantity", e.target.value)} />
                </div>
                <div>
                  <label htmlFor={`line-cost-${line.key}`} className="admin-form-label">Costo unitario</label>
                  <input id={`line-cost-${line.key}`} type="number" min="0" step="0.01" className={INPUT_CLASS} value={line.unitCost} onChange={(e) => updateLine(line.key, "unitCost", e.target.value)} />
                </div>
                <div className="store-line-subtotal">
                  <span className="admin-form-label">Subtotal</span>
                  <span>{formatMoney((Number(line.quantity) || 0) * (Number(line.unitCost) || 0))}</span>
                </div>
                <button type="button" className="btn btn-sm btn-outline-danger store-line-remove" onClick={() => removeLine(line.key)} disabled={lines.length === 1} aria-label={`Quitar producto ${index + 1}`}>
                  Quitar
                </button>
              </div>
            );
          })}
        </div>

        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-3">
          <button type="button" className="btn btn-outline-warning" onClick={() => setLines((prev) => [...prev, emptyLine()])} disabled={lines.length >= 50}>
            + Agregar línea
          </button>
          <span className="store-total">Total: {formatMoney(total)}</span>
        </div>

        {error && <p className="text-danger small mt-3" role="alert">{error}</p>}

        <button type="submit" className="btn btn-warning text-dark mt-3" disabled={saving}>
          {saving ? "Registrando..." : "Registrar compra"}
        </button>
      </form>

      {confirming && (
        <ConfirmModal
          title="Registrar compra"
          message={`Se van a ingresar ${filled.reduce((s, l) => s + Number(l.quantity), 0)} unidades de ${filled.length} producto(s) por ${formatMoney(total)}. ¿Confirmás?`}
          onConfirm={submit}
          onCancel={() => setConfirming(false)}
          confirmLabel="Registrar"
          confirmClass="btn btn-warning text-dark"
        />
      )}

      {addingSupplier && (
        <SupplierFormModal
          supplier={null}
          onClose={() => setAddingSupplier(false)}
          onSaved={(saved) => {
            setAddingSupplier(false);
            setSupplierId(String(saved.id));
            onSuppliersChanged();
          }}
        />
      )}
    </div>
  );
}

export default PurchaseSection;
