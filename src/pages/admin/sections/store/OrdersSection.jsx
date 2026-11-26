import { useCallback, useEffect, useState } from "react";
import PaginationControls from "../../../../components/PaginationControls/PaginationControls";
import Toast from "../../../../components/Toast/Toast";
import OrderStatusBadge from "../../../../components/OrderStatusBadge/OrderStatusBadge";
import useBranches from "../../../../hooks/useBranches";
import { getOrders, updateOrderStatus } from "../../../../services/store.services";
import { formatDateTime, formatMoney } from "../../../../utils/format";
import { cancellationReasonText, orderStatusNames } from "../../../../utils/orderStatus";
import { INPUT_CLASS, SELECT_CLASS } from "./shared";
import CancelOrderModal from "./CancelOrderModal";

const NEXT_STATUS = {
  paid: { status: "ready", label: "Marcar listo para retirar" },
  ready: { status: "delivered", label: "Marcar entregado" },
};

const CANCELLABLE = ["pending_payment", "paid", "ready"];

function OrdersSection() {
  const branches = useBranches();
  const [filters, setFilters] = useState({ status: "", branchId: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    getOrders({ ...filters, page, pageSize })
      .then((response) => { setData(response); setError(""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters, page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const advance = async (order) => {
    const next = NEXT_STATUS[order.status];
    setBusyId(order.id);
    try {
      await updateOrderStatus(order.id, next.status);
      setToast({ message: `Pedido #${order.id}: ${orderStatusNames[next.status].toLowerCase()}`, type: "success" });
      load();
    } catch (err) {
      setToast({ message: err.message, type: "danger" });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Pedidos</h2>
      </div>

      <div className="store-filters">
        <select className={SELECT_CLASS} value={filters.status} onChange={(e) => setFilter("status", e.target.value)} aria-label="Estado">
          <option value="">Todos los estados</option>
          {Object.entries(orderStatusNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select className={SELECT_CLASS} value={filters.branchId} onChange={(e) => setFilter("branchId", e.target.value)} aria-label="Sucursal">
          <option value="">Todas las sucursales</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <input type="date" className={INPUT_CLASS} value={filters.from} onChange={(e) => setFilter("from", e.target.value)} aria-label="Desde" />
        <input type="date" className={INPUT_CLASS} value={filters.to} onChange={(e) => setFilter("to", e.target.value)} aria-label="Hasta" />
      </div>

      {error && <p className="text-danger">{error}</p>}
      {loading && <p className="text-secondary">Cargando...</p>}

      {!loading && !error && (
        <>
          {data.items.length === 0 && <p className="text-secondary">No hay pedidos con esos filtros.</p>}
          <div className="store-orders">
            {data.items.map((order) => {
              const next = NEXT_STATUS[order.status];
              const isOpen = expanded === order.id;
              return (
                <div key={order.id} className={`store-order-card ${order.status === "cancelled" || order.status === "expired" ? "store-order-muted" : ""}`}>
                  <div className="store-order-header">
                    <div>
                      <span className="text-warning fw-bold">Pedido #{order.id}</span>
                      <span className="text-secondary ms-2 small">{formatDateTime(order.createdAt)}</span>
                    </div>
                    <OrderStatusBadge order={order} />
                  </div>
                  <div className="store-order-meta">
                    <span>Cliente: <strong>{order.client?.name ?? "Cliente eliminado"}</strong></span>
                    {order.client?.phone && <span>Tel.: {order.client.phone}</span>}
                    <span>Retira en: {order.branch?.name}</span>
                    <span>Total: <strong className="text-warning">{formatMoney(order.total)}</strong></span>
                  </div>
                  {order.status === "cancelled" && order.cancellationReason && (
                    <p className="text-secondary small mb-1">Motivo: {cancellationReasonText(order)}</p>
                  )}

                  {isOpen && (
                    <ul className="store-order-items">
                      {order.items.map((item) => (
                        <li key={item.productId}>
                          <span>{item.quantity} × {item.productName}</span>
                          <span className="text-secondary small">
                            {formatMoney(item.unitPrice)} c/u
                            {item.unitCost !== null && item.unitCost !== undefined && ` · costo ${formatMoney(item.unitCost)}`}
                          </span>
                          <span>{formatMoney(item.subtotal)}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="admin-row-actions mt-2">
                    <button className="btn btn-sm btn-outline-light" onClick={() => setExpanded(isOpen ? null : order.id)} aria-expanded={isOpen}>
                      {isOpen ? "Ocultar productos" : `Ver productos (${order.items.length})`}
                    </button>
                    {next && (
                      <button className="btn btn-sm btn-outline-success" onClick={() => advance(order)} disabled={busyId === order.id}>
                        {next.label}
                      </button>
                    )}
                    {CANCELLABLE.includes(order.status) && (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => setCancelling(order)}>Cancelar</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <PaginationControls
            currentPage={page}
            totalPages={Math.ceil(data.total / pageSize)}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            total={data.total}
          />
        </>
      )}

      {cancelling && (
        <CancelOrderModal
          order={cancelling}
          onClose={() => setCancelling(null)}
          onCancelled={(refunded) => {
            setCancelling(null);
            setToast({ message: refunded ? "Pedido cancelado con reembolso" : "Pedido cancelado", type: "success" });
            load();
          }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default OrdersSection;
