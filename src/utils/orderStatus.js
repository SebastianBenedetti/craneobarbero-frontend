import { formatMoney } from "./format";

const timeOf = (iso) =>
  new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

export const orderStatusNames = {
  pending_payment: "Esperando pago",
  paid: "Pagado",
  ready: "Listo para retirar",
  delivered: "Entregado",
  cancelled: "Cancelado",
  expired: "Expirado",
};

export const isOrderPayable = (order) =>
  order.status === "pending_payment" && (!order.paymentExpiresAt || new Date(order.paymentExpiresAt) > new Date());

export function getOrderBadge(order, { forClient = false } = {}) {
  switch (order.status) {
    case "pending_payment":
      return {
        label: order.paymentExpiresAt ? `Esperando pago (vence ${timeOf(order.paymentExpiresAt)})` : "Esperando pago",
        className: "status-badge-unpaid",
      };
    case "paid":
      return { label: forClient ? "Pagado · en preparación" : "Pagado", className: forClient ? "status-badge-completed" : "status-badge-paid" };
    case "ready":
      return { label: "Listo para retirar", className: "status-badge-completed" };
    case "delivered":
      return { label: "Entregado", className: "status-badge-completed" };
    case "cancelled":
      if (order.refundStatus === "refunded") return { label: "Cancelado · con reembolso", className: "status-badge-refunded" };
      if (order.refundStatus === "not_refunded") {
        return {
          label: forClient ? "Cancelado · sin reembolso" : `Cancelado · cobrado ${formatMoney(order.total)}`,
          className: forClient ? "status-badge-cancelled" : "status-badge-cancelled-paid",
        };
      }
      return { label: "Cancelado", className: "status-badge-cancelled" };
    case "expired":
      return { label: "Expirado", className: "status-badge-expired" };
    default:
      return { label: order.status, className: "status-badge-cancelled" };
  }
}

export const cancellationReasonText = (order) =>
  order.cancellationReason === "out_of_stock"
    ? "Se canceló porque, al acreditarse el pago, ya no quedaba stock suficiente."
    : order.cancellationReason || "";
