export const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const WEEKDAY_SHORT = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

export const WEEKDAYS = [
  { key: "monday", label: "Lun" },
  { key: "tuesday", label: "Mar" },
  { key: "wednesday", label: "Mié" },
  { key: "thursday", label: "Jue" },
  { key: "friday", label: "Vie" },
  { key: "saturday", label: "Sáb" },
  { key: "sunday", label: "Dom" },
];

const pad = (n) => String(n).padStart(2, "0");

export const toDateKey = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const fromDateKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayKey = () => toDateKey(new Date());

export const addDays = (key, days) => {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

export const monthRange = (year, month) => ({
  from: toDateKey(new Date(year, month, 1)),
  to: toDateKey(new Date(year, month + 1, 0)),
});

export const monthGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells = Math.ceil((offset + lastDay) / 7) * 7;
  return Array.from({ length: cells }, (_, i) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    return { key: toDateKey(date), day: date.getDate(), inMonth: date.getMonth() === month };
  });
};

export const formatLongDate = (key) =>
  fromDateKey(key).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const formatShortDate = (key) =>
  fromDateKey(key).toLocaleDateString("es-AR", { day: "numeric", month: "short" });

export const timeOptions = (fromHour, toHour) => {
  const result = [];
  for (let minutes = fromHour * 60; minutes <= toHour * 60; minutes += 30) {
    result.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }
  return result;
};

export const addMinutes = (time, minutes) => {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

export const formatMoney = (value) => `$${Number(value ?? 0).toLocaleString("es-AR")}`;
