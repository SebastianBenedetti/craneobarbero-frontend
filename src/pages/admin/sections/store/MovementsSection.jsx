import { useEffect, useState } from "react";
import PaginationControls from "../../../../components/PaginationControls/PaginationControls";
import { getProducts, getStockMovements } from "../../../../services/store.services";
import { formatDateTime, formatMoney } from "../../../../utils/format";
import { INPUT_CLASS, SELECT_CLASS, movementTypeNames } from "./shared";

function MovementsSection({ suppliers }) {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ productId: "", type: "", supplierId: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProducts({ active: "" }).then(setProducts).catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getStockMovements({ ...filters, page, pageSize })
      .then((response) => { if (!cancelled) { setData(response); setError(""); } })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters, page, pageSize]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Movimientos de stock</h2>
      </div>

      <div className="store-filters">
        <select className={SELECT_CLASS} value={filters.productId} onChange={(e) => setFilter("productId", e.target.value)} aria-label="Producto">
          <option value="">Todos los productos</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className={SELECT_CLASS} value={filters.type} onChange={(e) => setFilter("type", e.target.value)} aria-label="Tipo">
          <option value="">Todos los tipos</option>
          {Object.entries(movementTypeNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className={SELECT_CLASS} value={filters.supplierId} onChange={(e) => setFilter("supplierId", e.target.value)} aria-label="Proveedor">
          <option value="">Todos los proveedores</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="date" className={INPUT_CLASS} value={filters.from} onChange={(e) => setFilter("from", e.target.value)} aria-label="Desde" />
        <input type="date" className={INPUT_CLASS} value={filters.to} onChange={(e) => setFilter("to", e.target.value)} aria-label="Hasta" />
      </div>

      {error && <p className="text-danger">{error}</p>}
      {loading && <p className="text-secondary">Cargando...</p>}

      {!loading && !error && (
        <>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th>Cantidad</th><th>Saldo</th><th>Costo unit.</th><th>Detalle</th><th>Usuario</th></tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr><td colSpan={8} className="text-secondary text-center">No hay movimientos con esos filtros</td></tr>
                ) : (
                  data.items.map((m) => (
                    <tr key={m.id}>
                      <td>{formatDateTime(m.occurredAt)}</td>
                      <td>{m.productName}</td>
                      <td><span className={`store-movement store-movement-${m.type}`}>{movementTypeNames[m.type] ?? m.type}</span></td>
                      <td className={m.quantity > 0 ? "text-success" : "text-danger"}>{m.quantity > 0 ? `+${m.quantity}` : m.quantity}</td>
                      <td>{m.balanceAfter}</td>
                      <td>{m.unitCost === null ? "—" : formatMoney(m.unitCost)}</td>
                      <td className="small">
                        {m.supplier && <div>{m.supplier.name}</div>}
                        {m.documentNumber && <div>Comprobante {m.documentNumber}</div>}
                        {m.orderId && <div>Pedido #{m.orderId}</div>}
                        {m.reason && <div className="text-secondary">{m.reason}</div>}
                      </td>
                      <td>{m.user?.name ?? "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={page}
            totalPages={Math.ceil(data.total / pageSize)}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            total={data.total}
            sizes={[25, 50, 100]}
          />
        </>
      )}
    </div>
  );
}

export default MovementsSection;
