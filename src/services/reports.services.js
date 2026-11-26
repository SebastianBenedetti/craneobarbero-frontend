import { ApiError, apiRequest } from "./api";

const BASE_URL = import.meta.env.VITE_API_URL;

const queryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : "";
};

const get = (path, params, fallbackError) => apiRequest(`${path}${queryString(params)}`, { fallbackError });

export const getAdminSummary = (params) => get("/reports/admin/summary", params, "No se pudo cargar el resumen");
export const getAdminBranches = (params) => get("/reports/admin/branches", params, "No se pudo cargar el reporte por sucursal");
export const getAdminBarbers = (params) => get("/reports/admin/barbers", params, "No se pudo cargar el reporte por barbero");
export const getAdminServices = (params) => get("/reports/admin/services", params, "No se pudo cargar el reporte por servicio");
export const getAdminProducts = (params) => get("/reports/admin/products", params, "No se pudo cargar el reporte de productos");
export const getAdminPeriods = (params) => get("/reports/admin/periods", params, "No se pudo cargar el reporte por período");

export const getBarberSummary = (params) => get("/reports/barber/summary", params, "No se pudo cargar el resumen");
export const getBarberServices = (params) => get("/reports/barber/services", params, "No se pudieron cargar los servicios");
export const getBarberClients = (params) => get("/reports/barber/clients", params, "No se pudieron cargar los clientes");
export const getBarberPeriods = (params) => get("/reports/barber/periods", params, "No se pudo cargar el reporte por período");

async function downloadFile(path, params, fallbackName) {
  const token = localStorage.getItem("barberia-token");
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}${queryString(params)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error || "No se pudo descargar el reporte", { status: res.status, code: data?.code });
  }

  const disposition = res.headers.get("Content-Disposition") || "";
  const match =
    disposition.match(/filename\*=UTF-8''([^;]+)/i) || disposition.match(/filename="?([^";]+)"?/i);
  const fileName = match ? decodeURIComponent(match[1]) : fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return res.headers;
}

export const downloadAdminReport = (format, params) =>
  downloadFile("/reports/admin/export", { ...params, format }, `Reporte - Craneo Barbero.${format}`);

export async function downloadAiReport(params) {
  const headers = await downloadFile("/reports/admin/ai-report", params, "Reporte - Craneo Barbero.pdf");
  return headers.get("X-Report-Ai") === "true";
}
