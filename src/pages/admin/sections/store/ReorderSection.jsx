import { useEffect, useState } from "react";
import { getReorderList } from "../../../../services/store.services";
import { formatMoney } from "../../../../utils/format";

const groupBySupplier = (items) => {
  const groups = new Map();
  items.forEach((item) => {
    const key = item.defaultSupplier?.id ?? 0;
    if (!groups.has(key)) groups.set(key, { supplier: item.defaultSupplier, items: [] });
    groups.get(key).items.push(item);
  });
  return [...groups.values()];
};

function ReorderSection({ onCreatePurchase }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getReorderList().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="admin-section"><p className="text-danger">{error}</p></div>;
  if (!data) return <div className="admin-section"><p className="text-secondary">Cargando...</p></div>;

  const startPurchase = (group) =>
    onCreatePurchase({
      supplierId: group.supplier ? String(group.supplier.id) : "",
      lines: group.items.map((item) => ({
        key: crypto.randomUUID(),
        productId: String(item.id),
        quantity: item.suggestedQuantity ? String(item.suggestedQuantity) : "",
        unitCost: String(item.cost),
      })),
    });

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Para reponer</h2>
        {data.count > 0 && <span className="text-secondary">Costo estimado: <strong className="text-warning">{formatMoney(data.estimatedTotal)}</strong></span>}
      </div>
      <p className="text-secondary small">Productos activos con stock en el mínimo o por debajo, agrupados por proveedor habitual.</p>

      {data.count === 0 && <p className="text-success">No hay productos para reponer.</p>}

      {groupBySupplier(data.items).map((group) => (
        <div key={group.supplier?.id ?? 0} className="store-group">
          <div className="store-group-header">
            <h3 className="admin-breakdown-title mb-0">{group.supplier?.name ?? "Sin proveedor habitual"}</h3>
            <button className="btn btn-sm btn-warning text-dark" onClick={() => startPurchase(group)}>
              Registrar compra
            </button>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr><th>Producto</th><th>SKU</th><th>Stock</th><th>Mínimo</th><th>Sugerido</th><th>Costo</th><th>Estimado</th></tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.sku || "—"}</td>
                    <td className="store-low-stock">{item.stock}</td>
                    <td>{item.minStock}</td>
                    <td>{item.suggestedQuantity ?? "—"}</td>
                    <td>{formatMoney(item.cost)}</td>
                    <td>{item.estimatedCost === null ? "—" : formatMoney(item.estimatedCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ReorderSection;
