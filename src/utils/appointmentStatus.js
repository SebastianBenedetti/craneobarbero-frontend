const money = (value) => `$${Number(value ?? 0).toLocaleString("es-AR")}`;

const time = (iso) =>
  new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

export function appointmentStatus(appointment, { forClient = false } = {}) {
  const { status, paymentStatus } = appointment;
  if (status === "awaiting_payment") {
    return {
      tone: "unpaid",
      label: appointment.paymentExpiresAt ? `Esperando pago (vence ${time(appointment.paymentExpiresAt)})` : "Esperando pago",
    };
  }
  if (status === "pending") {
    return paymentStatus === "paid"
      ? { tone: "paid", label: "Abonado" }
      : {
          tone: "unpaid",
          label: appointment.paymentMethod === "cash" && appointment.createdByRole === "client"
            ? forClient ? "Pagás en el local" : "Paga en el local"
            : "Pendiente de abonar",
        };
  }
  if (status === "completed") return { tone: "completed", label: "Completado" };
  if (status === "expired") return { tone: "expired", label: "Expirado (no se pagó a tiempo)" };
  if (status === "cancelled") {
    if (paymentStatus === "refunded") {
      return { tone: "refunded", label: forClient ? "Cancelado · con reembolso" : "Cancelado · reembolsado" };
    }
    if (paymentStatus === "paid") {
      return { tone: "cancelled-paid", label: forClient ? "Cancelado · sin reembolso" : `Cancelado · cobrado ${money(appointment.price)}` };
    }
    return { tone: "cancelled", label: "Cancelado" };
  }
  return { tone: "cancelled", label: status };
}
