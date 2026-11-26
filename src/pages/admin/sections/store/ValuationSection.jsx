import { useEffect, useState } from "react";
import { getStockValuation } from "../../../../services/store.services";
import { formatMoney } from "../../../../utils/format";

function ValuationSection() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getStockValuation().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="admin-section"><p className="text-danger">{error}</p></div>;
  if (!data) return <div className="admin-section"><p className="text-secondary">Cargando...</p></div>;

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Valorización del stock</h2>
      </div>

      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-value text-info">{data.totalUnits.toLocaleString("es-AR")}</span>
          <span className="admin-stat-label">Unidades en stock</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value text-warning">{formatMoney(data.totalCostValue)}</span>
          <span className="admin-stat-label">Valor al costo</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value text-success">{formatMoney(data.totalSaleValue)}</span>
          <span className="admin-stat-label">Valor a precio de venta</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value text-light">{formatMoney(data.totalSaleValue - data.totalCostValue)}</span>
          <span className="admin-stat-label">Ganancia potencial</span>
        </div>
      </section>

      <p className="text-secondary small">El stock se valúa al costo de la última compra de cada producto.</p>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr><th>Producto</th><th>Categoría</th><th>Stock</th><th>Costo</th><th>Valor al costo</th><th>Precio</th><th>Valor de venta</th><th>Margen</th></tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr><td colSpan={8} className="text-secondary text-center">No hay productos con stock</td></tr>
            ) : (
              data.items.map((item) => (
                <tr key={item.id} className={item.isActive ? "" : "admin-row-inactive"}>
                  <td>{item.name}{!item.isActive && <span className="text-secondary small"> (desactivado)</span>}</td>
                  <td>{item.category?.name}</td>
                  <td>{item.stock}</td>
                  <td>{formatMoney(item.cost)}</td>
                  <td>{formatMoney(item.costValue)}</td>
                  <td>{formatMoney(item.salePrice)}</td>
                  <td>{formatMoney(item.saleValue)}</td>
                  <td>{item.marginPercent === null ? "—" : `${Number(item.marginPercent).toFixed(1)}%`}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ValuationSection;
