const BASE_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("barberia-token")}`,
});

const request = async (path, { method = "GET", body, fallbackError, auth = true } = {}) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: auth ? authHeaders() : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(data?.error || fallbackError || "No se pudo completar la operación");
    error.code = data?.code;
    error.status = res.status;
    error.errors = data?.errors;
    throw error;
  }
  return data;
};

const repeated = (name, values) => (values ?? []).map((v) => `&${name}=${encodeURIComponent(v)}`).join("");

export const getScheduleOverview = (from, to, branchIds, barberIds) =>
  request(`/schedule/overview?from=${from}&to=${to}${repeated("branchIds", branchIds)}${repeated("barberIds", barberIds)}`, {
    fallbackError: "No se pudo cargar la agenda",
  });

export const getScheduleDay = (date, barberId) =>
  request(`/schedule/day?date=${date}&barberId=${barberId}`, { fallbackError: "No se pudo cargar el día" });

export const getAppointmentsOfDay = async (date) => {
  const data = await request(`/appointments?from=${date}&to=${date}&pageSize=100`, {
    fallbackError: "No se pudieron cargar los turnos del día",
  });
  return data?.items ?? [];
};

export const previewRemoveSlots = (body) =>
  request("/schedule/slots/remove/preview", { method: "POST", body, fallbackError: "No se pudo analizar la eliminación" });

export const removeSlots = (body) =>
  request("/schedule/slots/remove", { method: "POST", body, fallbackError: "No se pudieron eliminar los horarios" });

export const previewAddSlots = (body) =>
  request("/schedule/slots/add/preview", { method: "POST", body, fallbackError: "No se pudo analizar la carga" });

export const addSlots = (body) =>
  request("/schedule/slots/add", { method: "POST", body, fallbackError: "No se pudieron agregar los horarios" });

export const getHolidays = (year) =>
  request(`/holidays?year=${year}`, { fallbackError: "No se pudieron cargar los feriados" });

export const createHoliday = (date, name) =>
  request("/holidays", { method: "POST", body: { date, name }, fallbackError: "No se pudo cargar el día no laborable" });

export const updateHoliday = (id, name, isActive) =>
  request(`/holidays/${id}`, { method: "PUT", body: { name, isActive }, fallbackError: "No se pudo actualizar el feriado" });

export const getAvailabilityDays = (barberId, cutId, from, to) =>
  request(`/appointments/availability/days?barberId=${barberId}&cutId=${cutId}&from=${from}&to=${to}`, {
    fallbackError: "No se pudo cargar la disponibilidad",
  });

export const getAvailabilityTimes = (barberId, cutId, date) =>
  request(`/appointments/availability?barberId=${barberId}&cutId=${cutId}&date=${date}`, {
    fallbackError: "No se pudieron cargar los horarios",
  });
