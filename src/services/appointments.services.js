import { apiDownload, apiGetAllPages, apiRequest } from "./api";

export const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "card", label: "Tarjeta" },
  { value: "transfer", label: "Transferencia" },
  { value: "wallet", label: "Billetera virtual" },
];

export const getStaffAppointments = () => apiGetAllPages("/appointments", "No se pudieron cargar los turnos");

export const getMyAppointments = () => apiGetAllPages("/appointments/my", "No se pudieron cargar tus turnos");

export const getAppointment = (id) => apiRequest(`/appointments/${id}`, { fallbackError: "No se pudo cargar el turno" });

export const bookAppointment = (barberId, cutId, appointmentDate) =>
  apiRequest("/appointments", {
    method: "POST",
    body: { barberId, cutId, appointmentDate },
    fallbackError: "No se pudo reservar el turno",
  });

export const createManualAppointment = (body) =>
  apiRequest("/appointments/manual", { method: "POST", body, fallbackError: "No se pudo crear el turno" });

export const payAppointment = (id) =>
  apiRequest(`/appointments/${id}/pay`, { method: "POST", fallbackError: "No se pudo iniciar el pago" });

export const getCancellationPreview = (id) =>
  apiRequest(`/appointments/${id}/cancellation-preview`, { fallbackError: "No se pudo revisar la cancelación" });

export const cancelAppointment = (id, reason) =>
  apiRequest(`/appointments/${id}/cancel`, {
    method: "POST",
    body: reason ? { reason } : {},
    fallbackError: "No se pudo cancelar el turno",
  });

export const rescheduleAppointment = (id, body) =>
  apiRequest(`/appointments/${id}/reschedule`, { method: "PUT", body, fallbackError: "No se pudo modificar el turno" });

export const confirmPaymentReturn = (search) =>
  apiRequest(`/payments/return${search}`, { fallbackError: "No se pudo confirmar el pago" });

export const searchClients = (query) =>
  apiRequest(`/clients/search?q=${encodeURIComponent(query)}`, { fallbackError: "No se pudo buscar clientes" });

export const getAvailableTimes = (barberId, cutId, date) =>
  apiRequest(`/appointments/availability?barberId=${barberId}&cutId=${cutId}&date=${date}`, {
    fallbackError: "No se pudieron cargar los horarios",
  });

export const resendVerificationEmail = () =>
  apiRequest("/auth/resend-verification", { method: "POST", fallbackError: "No se pudo reenviar el mail" });

export const downloadAppointmentCalendar = (id) =>
  apiDownload(`/appointments/${id}/calendar.ics`, "turno-craneo-barbero.ics", "No se pudo generar el archivo del calendario");
