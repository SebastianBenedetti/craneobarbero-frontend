import { useState } from "react";
import { revertPriceAdjustment } from "../../../../services/prices.services";
import ConfirmModal from "../../../../components/ConfirmModal/ConfirmModal";
import { formatDateTime, formatMoney, formatPercent } from "./priceFormat";

const ROUNDING_LABELS = { none: "sin redondeo", 10: "múltiplo de $10", 50: "múltiplo de $50", 100: "múltiplo de $100" };

function PriceAdjustmentsHistory({ adjustments, loading, onReverted, onError }) {
  const [reverting, setReverting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const handleRevert = async () => {
    const adjustment = reverting;
    setReverting(null);
    setBusy(true);
    try {
      const data = await revertPriceAdjustment(adjustment.id);
      setResult(data);
      onReverted(data);
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Ajustes aplicados</h2>
      </div>

      {loading && <p className="text-secondary">Cargando...</p>}

      {result && (
        <div className="prices-revert-result">
          <p className="mb-1">
            Se restauraron {result.restored} {result.restored === 1 ? "precio" : "precios"}.
          </p>
          {result.skipped.length > 0 && (
            <>
              <p className="text-warning mb-1">
                Estos ítems se cambiaron después del ajuste y quedaron con su precio actual:
              </p>
              <ul className="mb-0">
                {result.skipped.map((item) => (
                  <li key={`${item.entityType}-${item.entityId}`}>
                    {item.name}: {formatMoney(item.currentPrice)} (el ajuste lo había dejado en {formatMoney(item.adjustedPrice)})
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {!loading && (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Alcance</th>
                <th>Aumento</th>
                <th>Precios</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-secondary text-center">Todavía no se aplicó ningún ajuste</td>
                </tr>
              ) : (
                adjustments.map((a) => (
                  <tr key={a.id} className={a.revertedAt ? "admin-row-inactive" : ""}>
                    <td>
                      {formatDateTime(a.appliedAt)}
                      {a.appliedBy && <div className="admin-form-hint">{a.appliedBy.name}</div>}
                    </td>
                    <td>{a.scopeDescription}</td>
                    <td>
                      {formatPercent(a.percentage)}
                      <div className="admin-form-hint">
                        {a.source === "indec_api" ? `INDEC ${a.periodFrom === a.periodTo ? a.periodFrom : `${a.periodFrom} a ${a.periodTo}`}` : "Manual"} · {ROUNDING_LABELS[a.roundingMode] ?? a.roundingMode}
                      </div>
                    </td>
                    <td>{a.itemsCount}</td>
                    <td>
                      <span className={`admin-status-badge ${a.revertedAt ? "admin-status-badge-inactive" : "admin-status-badge-active"}`}>
                        {a.revertedAt ? "Revertido" : "Aplicado"}
                      </span>
                    </td>
                    <td>
                      {a.canRevert && (
                        <button className="btn btn-sm btn-outline-danger" disabled={busy} onClick={() => { setResult(null); setReverting(a); }}>
                          Revertir
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {reverting && (
        <ConfirmModal
          title="Revertir el último ajuste"
          message={`Se van a restaurar los precios anteriores de ${reverting.itemsCount} ${reverting.itemsCount === 1 ? "ítem" : "ítems"}. Los que se cambiaron después del ajuste quedan como están. ¿Confirmás?`}
          confirmLabel="Sí, revertir"
          onConfirm={handleRevert}
          onCancel={() => setReverting(null)}
        />
      )}
    </div>
  );
}

export default PriceAdjustmentsHistory;
