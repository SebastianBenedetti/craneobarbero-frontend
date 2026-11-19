const BASE_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = "barberia-token";

export const SESSION_EXPIRED_EVENT = "auth:session-expired";

export class ApiError extends Error {
  constructor(message, { status, code, errors } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

const describe = (data, fallback) => {
  const details = data?.errors ? Object.values(data.errors).flat() : [];
  return details.length > 0 ? details.join(" ") : data?.error || fallback;
};

export async function apiRequest(path, { method = "GET", body, auth = true, fallbackError = "No se pudo completar la operación" } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem(TOKEN_KEY);
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.");
  }

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && auth && token) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(describe(data, fallbackError), { status: res.status, code: data?.code, errors: data?.errors });
  }
  return data;
}

export async function apiGetAllPages(path, fallbackError) {
  const separator = path.includes("?") ? "&" : "?";
  const items = [];
  let page = 1;
  let total = Infinity;
  while (items.length < total) {
    const data = await apiRequest(`${path}${separator}page=${page}&pageSize=100`, { fallbackError });
    if (Array.isArray(data)) return data;
    const pageItems = data?.items ?? [];
    items.push(...pageItems);
    total = data?.total ?? items.length;
    if (pageItems.length === 0) break;
    page += 1;
  }
  return items;
}
