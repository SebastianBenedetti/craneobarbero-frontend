import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import OrderStatusBadge from "../../../../components/OrderStatusBadge/OrderStatusBadge";
import { getAdminProducts } from "../../../../services/reports.services";
import { getOrders, getProducts } from "../../../../services/store.services";
import { formatDateTime, formatMoney } from "../../../../utils/format";

const STATUS_CARDS = [
  { status: "paid", label: "Pedidos para preparar", className: "text-warning" },
  { status: "ready", label: "Listos para entregar", className: "text-info" },
  { status: "pending_payment", label: "Esperando pago", className: "text-secondary" },
];

const countOrders = (status) => getOrders({ status, page: 1, pageSize: 1 }).then((r) => r.total).catch(() => null);

function StoreOverview({ period, productIncome }) {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const [latest, setLatest] = useState([]);
  const [lowest, setLowest] = useState([]);
  const [topSellers, setTopSellers] = useState([]);

  useEffect(() => {
    Promise.all(STATUS_CARDS.map((c) => countOrders(c.status))).then((values) =>
      setCounts(Object.fromEntries(STATUS_CARDS.map((c, i) => [c.status, values[i]]))));
    getOrders({ page: 1, pageSize: 5 }).then((r) => setLatest(r.items)).catch(() => setLatest([]));
    getProducts({ active: "true" })
      .then((items) => setLowest([...items].sort((a, b) => a.stock - a.minStock - (b.stock - b.minStock) || a.stock - b.stock).slice(0, 5)))
      .catch(() => setLowest([]));
  }, []);

  useEffect(() => {
    getAdminProducts(period)
      .then((r) => setTopSellers([...r.products].sort((a, b) => b.units - a.units || b.income - a.income).slice(0, 5)))
      .catch(() => setTopSellers([]));
  }, [period]);

  return (
    <section className="store-overview">
      <h2 className="admin-section-title">Tienda</h2>

      <section className="admin-stats-grid">
        {STATUS_CARDS.map((card) => (
          <button
            key={card.status}
            type="button"
            className="admin-stat-card store-stat-button"
            onClick={() => navigate("/admin/store")}
          >
            <span className={`admin-stat-value ${card.className}`}>{counts[card.status] ?? "—"}</span>
            <span className="admin-stat-label">{card.label}</span>
          </button>
        ))}
        <div className="admin-stat-card">
          <span className="admin-stat-value text-success">{formatMoney(productIncome)}</span>
          <span className="admin-stat-label">Ventas de productos</span>
        </div>
      </section>

      <section className="admin-breakdown-grid">
        <div className="admin-breakdown-card">
          <h3 className="admin-breakdown-title">Productos más vendidos</h3>
          {topSellers.length === 0 ? (
            <p className="text-secondary" style={{ fontSize: "14px" }}>Sin ventas en el período</p>
          ) : (
            <table className="admin-breakdown-table">
              <thead>
                <tr><th>Producto</th><th>Unidades</th><th>Ventas</th></tr>
              </thead>
              <tbody>
                {topSellers.map((row) => (
                  <tr key={row.productId}>
                    <td>{row.name}</td>
                    <td className="text-warning">{row.units}</td>
                    <td>{formatMoney(row.income)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="admin-breakdown-card">
          <h3 className="admin-breakdown-title">Productos con menos stock</h3>
          {lowest.length === 0 ? (
            <p className="text-secondary" style={{ fontSize: "14px" }}>Sin productos</p>
          ) : (
            <table className="admin-breakdown-table">
              <thead>
                <tr><th>Producto</th><th>Stock</th></tr>
              </thead>
              <tbody>
                {lowest.map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.name}
                      {p.lowStock && <span className="store-chip-warning ms-2">Para reponer</span>}
                    </td>
                    <td>
                      <span className={p.lowStock ? "store-low-stock" : "text-warning"}>{p.stock}</span>
                      <span className="text-secondary small"> / mín. {p.minStock}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="admin-breakdown-card mb-4">
        <div className="store-group-header">
          <h3 className="admin-breakdown-title mb-0">Últimos pedidos</h3>
          <button className="btn btn-sm btn-outline-warning" onClick={() => navigate("/admin/store")}>Ver todos</button>
        </div>
        {latest.length === 0 ? (
          <p className="text-secondary mb-0" style={{ fontSize: "14px" }}>Todavía no hay pedidos</p>
        ) : (
          <ul className="store-latest-orders">
            {latest.map((order) => (
              <li key={order.id}>
                <span className="text-warning fw-bold">#{order.id}</span>
                <span className="store-latest-client">{order.client?.name ?? "Cliente eliminado"}</span>
                <span className="text-secondary small">{formatDateTime(order.createdAt)}</span>
                <span>{formatMoney(order.total)}</span>
                <OrderStatusBadge order={order} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default StoreOverview;
