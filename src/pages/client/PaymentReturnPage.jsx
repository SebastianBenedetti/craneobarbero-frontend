import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import AppointmentStatusBadge from "../../components/AppointmentStatusBadge/AppointmentStatusBadge";
import OrderStatusBadge from "../../components/OrderStatusBadge/OrderStatusBadge";
import { confirmPaymentReturn, payAppointment } from "../../services/appointments.services";
import { payOrder } from "../../services/store.services";
import { formatMoney } from "../../utils/format";
import { isOrderPayable } from "../../utils/orderStatus";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const formatDate = (iso) =>
  capitalize(new Date(iso).toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }));

function PaymentReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [actionError, setActionError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    document.title = " Pago | Cráneo Barbero";
  }, []);

  useEffect(() => {
    let cancelled = false;
    confirmPaymentReturn(location.search)
      .then((data) => !cancelled && setState({ loading: false, data, error: "" }))
      .catch((err) => !cancelled && setState({ loading: false, data: null, error: err.message }));
    return () => { cancelled = true; };
  }, [location.search]);

  const retry = async () => {
    setPaying(true);
    setActionError("");
    try {
      const { checkoutUrl } = order ? await payOrder(order.id) : await payAppointment(appointment.id);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setActionError(err.message);
      setPaying(false);
    }
  };

  const appointment = state.data?.appointment;
  const order = state.data?.order;
  const confirmed = order
    ? ["paid", "ready", "delivered"].includes(order.status)
    : appointment?.status === "pending" && appointment?.paymentStatus === "paid";
  const waiting = order ? isOrderPayable(order) : appointment?.status === "awaiting_payment";
  const inProcess = waiting && ["pending", "in_process"].includes(state.data?.gatewayStatus);
  const outOfStock = order?.status === "cancelled" && order?.cancellationReason === "out_of_stock";

  let title = "Revisando tu pago…";
  if (!state.loading) {
    if (state.error) title = "No pudimos confirmar el pago";
    else if (confirmed) title = order ? "¡Listo! Tu compra quedó confirmada" : "¡Listo! Tu turno quedó confirmado";
    else if (outOfStock) title = "No pudimos completar tu compra";
    else if (inProcess) title = "Tu pago está en proceso";
    else if (waiting) title = "El pago no se completó";
    else title = order ? "Este pedido ya no se puede pagar" : "Este turno ya no se puede pagar";
  }

  return (
    <div className="page-transition" style={{ maxWidth: "620px", margin: "0 auto", padding: "110px 20px 48px" }}>
      <div className="card bg-dark border-warning p-4">
        <h3 className="text-warning mb-3">{title}</h3>

        {state.loading && <p className="text-secondary mb-0">Estamos consultando el estado del pago con Mercado Pago.</p>}
        {state.error && <p className="text-danger">{state.error}</p>}

        {appointment && (
          <>
            <div className="mb-3"><AppointmentStatusBadge appointment={appointment} forClient /></div>
            <p className="text-light mb-1">{formatDate(appointment.appointmentDate)}</p>
            <p className="text-light mb-1">Servicio: {appointment.cut?.name}</p>
            <p className="text-light mb-1">Barbero: {appointment.barber?.name}</p>
            <p className="text-light mb-3">Sucursal: {appointment.branch?.name} — {appointment.branch?.address}</p>

            {confirmed && <p className="text-secondary">Te enviamos un mail con la confirmación y los botones para agregarlo a tu calendario.</p>}
            {inProcess && <p className="text-secondary">Mercado Pago todavía está procesando el pago. Te avisamos por mail cuando se acredite.</p>}
            {waiting && !inProcess && (
              <p className="text-secondary">
                Podés volver a intentarlo antes de que venza la reserva; si no, el horario se libera.
              </p>
            )}
          </>
        )}

        {order && (
          <>
            <div className="mb-3"><OrderStatusBadge order={order} forClient /></div>
            <p className="text-light mb-1">Pedido #{order.id}</p>
            <ul className="text-light mb-1 ps-3">
              {order.items.map((item) => (
                <li key={item.productId}>{item.quantity} × {item.productName} — {formatMoney(item.subtotal)}</li>
              ))}
            </ul>
            <p className="text-light mb-1">Total: {formatMoney(order.total)}</p>
            <p className="text-light mb-3">Retiro en {order.branch?.name} — {order.branch?.address}</p>

            {confirmed && <p className="text-secondary">En "Mis compras" vas a ver cuándo está listo para retirar.</p>}
            {outOfStock && (
              <p className="text-secondary">
                Al acreditarse el pago ya no quedaba stock suficiente, así que cancelamos el pedido
                {order.refundStatus === "refunded" ? " y te devolvimos el dinero por Mercado Pago." : ". Estamos gestionando la devolución del dinero."}
              </p>
            )}
            {inProcess && <p className="text-secondary">Mercado Pago todavía está procesando el pago. Revisá "Mis compras" en unos minutos.</p>}
            {waiting && !inProcess && <p className="text-secondary">Podés volver a intentarlo antes de que venza el pedido.</p>}
          </>
        )}

        {actionError && <p className="text-danger" role="alert">{actionError}</p>}

        <div className="d-flex flex-wrap gap-2 mt-2">
          {waiting && !inProcess && (
            <button className="btn btn-warning text-dark" onClick={retry} disabled={paying}>
              {paying ? "Abriendo el pago…" : "Reintentar el pago"}
            </button>
          )}
          {order ? (
            <button className="btn btn-outline-warning" onClick={() => navigate("/my-account/purchases")}>
              Ir a Mis compras
            </button>
          ) : (
            <button className="btn btn-outline-warning" onClick={() => navigate("/my-account/appointments")}>
              Ir a Mis turnos
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentReturnPage;
