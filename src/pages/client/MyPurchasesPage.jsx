import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import OrderStatusBadge from "../../components/OrderStatusBadge/OrderStatusBadge";
import PaginationControls from "../../components/PaginationControls/PaginationControls";
import { getMyOrders, payOrder } from "../../services/store.services";
import { formatDateTime, formatMoney } from "../../utils/format";
import { cancellationReasonText, isOrderPayable } from "../../utils/orderStatus";
import "../../styles/store.css";

const PICKUP_TEXT = {
  paid: "Estamos preparando tu pedido. Te lo entregamos en la sucursal.",
  ready: "Tu pedido está listo: pasá a retirarlo por la sucursal.",
};

function MyPurchasesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.notice;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payingId, setPayingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    document.title = "Mis compras | Cráneo Barbero";
  }, []);

  const load = useCallback(() => {
    getMyOrders(page, pageSize)
      .then((response) => { setData(response); setError(""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, pageSize]);

  useEffect(() => { load(); }, [load]);

  const pay = async (order) => {
    setPayingId(order.id);
    setActionError(null);
    try {
      const { checkoutUrl } = await payOrder(order.id);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setActionError({ id: order.id, message: err.message });
      setPayingId(null);
      load();
    }
  };

  return (
    <div className="page-transition my-purchases">
      <button className="btn btn-outline-secondary btn-sm mb-4" onClick={() => navigate(-1)}>← Volver</button>
      <h3 className="text-warning mb-4">Mis compras</h3>

      {notice && <div className="alert alert-warning py-2" role="status">{notice}</div>}
      {loading && <p className="text-secondary">Cargando compras...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && data.items.length === 0 && (
        <div className="card bg-dark border-secondary p-4 text-center">
          <p className="text-secondary mb-3">Todavía no hiciste compras.</p>
          <button className="btn btn-warning text-dark" onClick={() => navigate("/shop")}>Ir a la tienda</button>
        </div>
      )}

      {!loading && data.items.map((order) => {
        const cancelled = order.status === "cancelled";
        const payable = isOrderPayable(order);
        return (
          <div key={order.id} className={`card bg-dark mb-3 p-4 ${cancelled ? "border-secondary purchase-cancelled" : order.status === "pending_payment" ? "border-warning" : "border-secondary"}`}>
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
              <div>
                <span className={`fw-bold ${cancelled ? "text-secondary" : "text-warning"}`}>Pedido #{order.id}</span>
                <span className="text-secondary ms-2 small">{formatDateTime(order.createdAt)}</span>
              </div>
              <OrderStatusBadge order={order} forClient />
            </div>

            <ul className="purchase-items">
              {order.items.map((item) => (
                <li key={item.productId}>
                  <span className="purchase-item-name">{item.quantity} × {item.productName}</span>
                  <span>{formatMoney(item.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className="d-flex justify-content-between flex-wrap gap-2 mt-2">
              <span className="text-light small">Retiro en {order.branch?.name} — {order.branch?.address}</span>
              <span className="text-light">Total <strong className={cancelled ? "" : "text-warning"}>{formatMoney(order.total)}</strong></span>
            </div>

            {PICKUP_TEXT[order.status] && <p className="text-secondary small mt-2 mb-0">{PICKUP_TEXT[order.status]}</p>}
            {cancelled && order.cancellationReason === "out_of_stock" && (
              <p className="text-secondary small mt-2 mb-0">{cancellationReasonText(order)}{order.refundStatus === "refunded" ? " Te devolvimos el dinero." : " Estamos gestionando la devolución del dinero."}</p>
            )}

            {order.status === "pending_payment" && (
              <div className="mt-3">
                {payable ? (
                  <button className="btn btn-warning text-dark btn-sm" onClick={() => pay(order)} disabled={payingId === order.id}>
                    {payingId === order.id ? "Abriendo el pago…" : "Pagar"}
                  </button>
                ) : (
                  <p className="text-secondary small mb-0">El tiempo para pagar venció.</p>
                )}
                {actionError?.id === order.id && <p className="text-danger small mt-2 mb-0" role="alert">{actionError.message}</p>}
              </div>
            )}
          </div>
        );
      })}

      {!loading && (
        <PaginationControls
          currentPage={page}
          totalPages={Math.ceil(data.total / pageSize)}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
          total={data.total}
        />
      )}
    </div>
  );
}

export default MyPurchasesPage;
