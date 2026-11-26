import { useCallback, useEffect, useState } from "react";
import PaginationControls from "../../../../components/PaginationControls/PaginationControls";
import Toast from "../../../../components/Toast/Toast";
import { getProducts } from "../../../../services/store.services";
import { formatMoney } from "../../../../utils/format";
import { INPUT_CLASS, SELECT_CLASS, paginate } from "./shared";
import ProductFormModal from "./ProductFormModal";
import StockAdjustmentModal from "./StockAdjustmentModal";

const ACTIVE_FILTERS = [
  { value: "true", label: "Activos" },
  { value: "false", label: "Desactivados" },
  { value: "", label: "Todos" },
];

function ProductsSection({ categories, suppliers, onStockChanged }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ categoryId: "", q: "", active: "true", lowStock: false });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    getProducts({
      categoryId: filters.categoryId,
      q: filters.q,
      active: filters.active,
      lowStock: filters.lowStock ? "true" : "",
    })
      .then((data) => { setProducts(data); setError(""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.q === search.trim() ? prev : { ...prev, q: search.trim() }));
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSaved = (message) => {
    setEditing(null);
    setAdjusting(null);
    load();
    onStockChanged?.();
    setToast({ message, type: "success" });
  };

  const totalPages = Math.ceil(products.length / pageSize);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Productos</h2>
        <button className="btn btn-warning text-dark" onClick={() => setEditing({})} disabled={categories.length === 0}>
          + Agregar producto
        </button>
      </div>
      {categories.length === 0 && (
        <p className="text-secondary small">Primero creá una categoría en la pestaña "Categorías".</p>
      )}

      <div className="store-filters">
        <input
          type="search"
          className={INPUT_CLASS}
          placeholder="Buscar por nombre o SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar productos"
        />
        <select className={SELECT_CLASS} value={filters.categoryId} onChange={(e) => setFilter("categoryId", e.target.value)} aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={SELECT_CLASS} value={filters.active} onChange={(e) => setFilter("active", e.target.value)} aria-label="Estado">
          {ACTIVE_FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
        <label className="store-check">
          <input type="checkbox" checked={filters.lowStock} onChange={(e) => setFilter("lowStock", e.target.checked)} />
          Solo con stock bajo
        </label>
      </div>

      {loading && <p className="text-secondary">Cargando...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && (
        <>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                  <th>Costo</th>
                  <th>Margen</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={8} className="text-secondary text-center">No hay productos con esos filtros</td></tr>
                ) : (
                  paginate(products, currentPage, pageSize).map((p) => (
                    <tr key={p.id} className={p.isActive ? "" : "admin-row-inactive"}>
                      <td>
                        <div className="store-product-cell">
                          {p.imageUrl && <img src={p.imageUrl} alt="" className="store-thumb" onError={(e) => { e.target.style.display = "none"; }} />}
                          <div>
                            <div>{p.name}</div>
                            {p.sku && <div className="text-secondary small">SKU {p.sku}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{p.category?.name}</td>
                      <td>{formatMoney(p.salePrice)}</td>
                      <td>{formatMoney(p.cost)}</td>
                      <td>
                        {formatMoney(p.margin)}
                        {p.marginPercent !== null && <span className="text-secondary small"> ({Number(p.marginPercent).toFixed(1)}%)</span>}
                      </td>
                      <td>
                        <span className={p.lowStock ? "store-low-stock" : ""}>{p.stock}</span>
                        <span className="text-secondary small"> / mín. {p.minStock}</span>
                        {p.lowStock && <div><span className="store-chip-warning">Para reponer</span></div>}
                      </td>
                      <td>
                        <span className={`admin-status-badge ${p.isActive ? "admin-status-badge-active" : "admin-status-badge-inactive"}`}>
                          {p.isActive ? "Activo" : "Desactivado"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button className="btn btn-sm btn-outline-warning" onClick={() => setEditing(p)}>Editar</button>
                          <button className="btn btn-sm btn-outline-light" onClick={() => setAdjusting(p)}>Ajustar stock</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            total={products.length}
          />
        </>
      )}

      {editing && (
        <ProductFormModal
          product={editing.id ? editing : null}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setEditing(null)}
          onSaved={() => handleSaved(editing.id ? "Producto actualizado" : "Producto creado. Cargá el stock con una compra.")}
        />
      )}

      {adjusting && (
        <StockAdjustmentModal
          product={adjusting}
          onClose={() => setAdjusting(null)}
          onSaved={() => handleSaved("Ajuste de stock registrado")}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default ProductsSection;
