export const formatMoney = (value) =>
  `$${Number(value ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatPercent = (value) =>
  `${Number(value ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 4 })}%`;

export const formatDateTime = (value) =>
  new Date(value).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });

export const plural = (value, one, many) => `${Number(value ?? 0).toLocaleString("es-AR")} ${Number(value) === 1 ? one : many}`;

export const formatTurns = (value) => (Number(value) === 1 ? "1 turno" : `${Number(value ?? 0).toLocaleString("es-AR")} turnos`);

export const appointmentStatusNames = {
  awaiting_payment: "Esperando pago",
  pending: "Pendiente",
  completed: "Completado",
  cancelled: "Cancelado",
  expired: "Expirado",
};
