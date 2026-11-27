import { useCallback, useEffect, useState } from "react";
import {
  applyPriceAdjustment,
  getActiveCuts,
  getAdminProducts,
  getInflationSuggestion,
  getProductCategories,
  previewPriceAdjustment,
} from "../../../../services/prices.services";
import ConfirmModal from "../../../../components/ConfirmModal/ConfirmModal";
import { formatMoney, formatPercent } from "../../../../utils/format";

const ROUNDING_OPTIONS = [
  { value: "none", label: "Sin redondeo" },
  { value: "10", label: "Al múltiplo de $10" },
  { value: "50", label: "Al múltiplo de $50" },
  { value: "100", label: "Al múltiplo de $100" },
];

function PriceAdjustmentForm({ onApplied, onError }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [cuts, setCuts] = useState([]);
  const [cutIds, setCutIds] = useState([]);
  const [direction, setDirection] = useState("up");
  const [scopeType, setScopeType] = useState("all");
  const [categoryId, setCategoryId] = useState("");
  const [productIds, setProductIds] = useState([]);
  const [includeCuts, setIncludeCuts] = useState(false);
  const [percentage, setPercentage] = useState("");
  const [rounding, setRounding] = useState("none");
  const [period, setPeriod] = useState({ from: "", to: "" });
  const [suggestion, setSuggestion] = useState(null);
  const [suggesting, setSuggesting] = useState(true);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const showSuggestion = useCallback((request) => request
    .then((data) => {
      setSuggestion(data);
      if (data.available) {
        setDirection("up");
        setPercentage(String(data.percentage));
        setPeriod({ from: data.from, to: data.to });
      }
    })
    .catch((err) => setSuggestion({ available: false, message: err.message }))
    .finally(() => setSuggesting(false)), []);

  useEffect(() => {
    Promise.all([getProductCategories(), getAdminProducts(), getActiveCuts()])
      .then(([categoryList, productList, cutList]) => {
        setCategories(categoryList);
        setProducts(productList);
        setCuts(cutList);
      })
      .catch((err) => onError(err.message));
    showSuggestion(getInflationSuggestion());
  }, [onError, showSuggestion]);

  const askInflation = (from, to) => {
    setSuggesting(true);
    showSuggestion(getInflationSuggestion(from, to));
  };

  const resetPreview = () => {
    setPreview(null);
    setFormError("");
  };

  const fromInflation = direction === "up" && suggestion?.available && Number(percentage) === suggestion.percentage;
  const decrease = direction === "down";

  const buildBody = () => ({
    scopeType,
    categoryId: scopeType === "category" ? Number(categoryId) || null : null,
    productIds: scopeType === "selection" ? productIds : null,
    cutIds: scopeType === "selection" ? cutIds : null,
    includeCuts: scopeType !== "selection" && includeCuts,
    percentage: Number(String(percentage).replace(",", ".")) * (decrease ? -1 : 1),
    rounding,
    source: fromInflation ? "indec_api" : "manual",
    periodFrom: fromInflation ? suggestion.from : null,
    periodTo: fromInflation ? suggestion.to : null,
  });

  const handlePreview = async (e) => {
    e.preventDefault();
    if (preview) {
      setPreview(null);
      return;
    }
    if (scopeType === "selection" && productIds.length === 0 && cutIds.length === 0) {
      setFormError("Elegí al menos un producto o un servicio.");
      return;
    }
    setLoading(true);
    setFormError("");
    try {
      setPreview(await previewPriceAdjustment(buildBody()));
    } catch (err) {
      setPreview(null);
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    setConfirming(false);
    setLoading(true);
    try {
      const adjustment = await applyPriceAdjustment(buildBody());
      setPreview(null);
      onApplied(adjustment);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (id) => {
    resetPreview();
    setProductIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const toggleCut = (id) => {
    resetPreview();
    setCutIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Actualizar precios</h2>
      </div>

      <form onSubmit={handlePreview} className="prices-form">
        <div className="prices-grid">
          <fieldset className="prices-card">
            <legend className="admin-form-label">1. Qué precios</legend>
            {[
              { value: "all", label: "Todos los productos" },
              { value: "category", label: "Una categoría" },
              { value: "selection", label: "Elegir productos y servicios" },
            ].map((option) => (
              <label key={option.value} className="prices-option">
                <input
                  type="radio"
                  name="scopeType"
                  value={option.value}
                  checked={scopeType === option.value}
                  onChange={() => { setScopeType(option.value); resetPreview(); }}
                />
                {option.label}
              </label>
            ))}

            {scopeType === "category" && (
              <select
                className="form-select bg-secondary text-white border-secondary mt-2"
                value={categoryId}
                onChange={(e) => { setCategoryId(e.target.value); resetPreview(); }}
                aria-label="Categoría"
                required
              >
                <option value="">Elegí una categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            {scopeType === "selection" && (
              <div className="prices-product-list">
                <div role="group" aria-label="Servicios">
                  <p className="prices-list-title">Servicios</p>
                  {cuts.map((c) => (
                    <label key={c.id} className="prices-option">
                      <input type="checkbox" checked={cutIds.includes(c.id)} onChange={() => toggleCut(c.id)} />
                      {c.name} <span className="text-secondary">({formatMoney(c.price)})</span>
                    </label>
                  ))}
                </div>
                <div role="group" aria-label="Productos">
                  <p className="prices-list-title">Productos</p>
                  {products.length === 0 && <p className="text-secondary mb-0">No hay productos activos.</p>}
                  {products.map((p) => (
                    <label key={p.id} className="prices-option">
                      <input type="checkbox" checked={productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                      {p.name} <span className="text-secondary">({formatMoney(p.salePrice)})</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {scopeType !== "selection" && (
              <label className="prices-option mt-2">
                <input type="checkbox" checked={includeCuts} onChange={(e) => { setIncludeCuts(e.target.checked); resetPreview(); }} />
                Incluir los servicios (cortes)
              </label>
            )}
          </fieldset>

          <fieldset className="prices-card">
            <legend className="admin-form-label">2. Cuánto ajustar</legend>
            <div className="store-segmented mb-3" role="radiogroup" aria-label="Tipo de ajuste">
              <button type="button" role="radio" aria-checked={direction === "up"} className={direction === "up" ? "active" : ""}
                onClick={() => { setDirection("up"); resetPreview(); }}>Aumentar</button>
              <button type="button" role="radio" aria-checked={direction === "down"} className={direction === "down" ? "active" : ""}
                onClick={() => { setDirection("down"); resetPreview(); }}>Bajar</button>
            </div>
            <div className="prices-period">
              <label className="admin-form-hint" htmlFor="period-from">Desde</label>
              <input
                id="period-from"
                type="month"
                className="form-control bg-secondary text-white border-secondary"
                value={period.from}
                onChange={(e) => setPeriod((prev) => ({ ...prev, from: e.target.value }))}
              />
              <label className="admin-form-hint" htmlFor="period-to">Hasta</label>
              <input
                id="period-to"
                type="month"
                className="form-control bg-secondary text-white border-secondary"
                value={period.to}
                onChange={(e) => setPeriod((prev) => ({ ...prev, to: e.target.value }))}
              />
              <button
                type="button"
                className="btn btn-outline-warning"
                disabled={suggesting}
                onClick={() => { resetPreview(); askInflation(period.from, period.to || period.from); }}
              >
                {suggesting ? "Consultando..." : "Consultar INDEC"}
              </button>
            </div>

            {suggestion && (
              <p className={`prices-suggestion ${suggestion.available ? "" : "text-warning"}`}>
                {suggestion.available
                  ? `Inflación del INDEC ${suggestion.from === suggestion.to ? `de ${suggestion.from}` : `acumulada de ${suggestion.from} a ${suggestion.to}`}: ${formatPercent(suggestion.percentage)}${suggestion.source === "argentinadatos" ? " (dato de ArgentinaDatos)" : ""}.`
                  : suggestion.message}
              </p>
            )}

            <label className="admin-form-label" htmlFor="percentage">{decrease ? "Porcentaje de baja (%)" : "Porcentaje de aumento (%)"}</label>
            <input
              id="percentage"
              type="number"
              min="0.0001"
              max={decrease ? "99.9999" : "100"}
              step="0.0001"
              className="form-control bg-secondary text-white border-secondary"
              value={percentage}
              onChange={(e) => { setPercentage(e.target.value); resetPreview(); }}
              required
            />
            <p className="admin-form-hint mb-2">Podés cambiarlo o escribirlo a mano.</p>

            <label className="admin-form-label" htmlFor="rounding">Redondeo</label>
            <select
              id="rounding"
              className="form-select bg-secondary text-white border-secondary"
              value={rounding}
              onChange={(e) => { setRounding(e.target.value); resetPreview(); }}
            >
              {ROUNDING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="admin-form-hint">
              {decrease ? "En una baja el redondeo es hacia abajo." : "En un aumento el redondeo es hacia arriba."} El costo de los productos no cambia.
            </p>
          </fieldset>
        </div>

        {formError && <p className="text-danger mt-2">{formError}</p>}
        <button type="submit" className={`btn mt-2 ${preview ? "btn-outline-warning" : "btn-warning text-dark"}`} disabled={loading} aria-expanded={Boolean(preview)}>
          {loading && !preview ? "Calculando..." : preview ? "Ocultar vista previa" : "Ver vista previa"}
        </button>
      </form>

      {preview && (
        <div className="prices-preview">
          <h3 className="admin-section-title">3. Vista previa</h3>
          <p className="text-secondary">{preview.scopeDescription}. {preview.message}</p>
          {preview.itemsCount === 0 ? (
            <p className="text-warning">No hay precios para modificar con ese alcance.</p>
          ) : (
            <>
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ítem</th>
                      <th>Precio actual</th>
                      <th>Precio nuevo</th>
                      <th>Diferencia</th>
                      <th>Margen resultante</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.items.map((item) => (
                      <tr key={`${item.entityType}-${item.entityId}`}>
                        <td>
                          {item.name}
                          <div className="admin-form-hint">{item.entityType === "cut" ? "Servicio" : "Producto"}</div>
                        </td>
                        <td>{formatMoney(item.currentPrice)}</td>
                        <td className="text-warning">{formatMoney(item.newPrice)}</td>
                        <td>{item.difference > 0 ? "+" : "−"}{formatMoney(Math.abs(item.difference))}</td>
                        <td>{item.marginPercent === null || item.marginPercent === undefined ? "—" : formatPercent(item.marginPercent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="prices-apply">
                <button type="button" className="btn btn-warning text-dark" disabled={loading} onClick={() => setConfirming(true)}>
                  {loading ? "Aplicando..." : preview.percentage < 0 ? "Aplicar baja" : "Aplicar aumento"}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {confirming && preview && (
        <ConfirmModal
          title={preview.percentage < 0 ? "Confirmar baja" : "Confirmar aumento"}
          message={`Vas a modificar ${preview.itemsCount} ${preview.itemsCount === 1 ? "precio" : "precios"} con ${preview.percentage < 0 ? "una baja" : "un aumento"} de ${formatPercent(Math.abs(preview.percentage))}. ¿Confirmás?`}
          confirmLabel="Sí, aplicar"
          confirmClass="btn btn-warning text-dark"
          onConfirm={handleApply}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  );
}

export default PriceAdjustmentForm;
