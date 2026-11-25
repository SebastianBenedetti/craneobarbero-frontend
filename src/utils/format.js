export const formatMoney = (value) =>
  `$${Number(value ?? 0).toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatPercent = (value) =>
  `${Number(value ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 4 })}%`;

export const formatDateTime = (value) =>
  new Date(value).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
