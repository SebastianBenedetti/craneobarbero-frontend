import { apiRequest } from "./api";

export const listUsers = ({ role, active, q, page = 1, pageSize = 10 }) => {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (role) params.set("role", role);
  if (active !== undefined && active !== null) params.set("active", String(active));
  if (q?.trim()) params.set("q", q.trim());
  return apiRequest(`/users?${params}`, { fallbackError: "No se pudieron cargar los usuarios" });
};

export const createUser = (user) =>
  apiRequest("/users", { method: "POST", body: user, fallbackError: "No se pudo crear el usuario" });

export const updateUser = (id, user) =>
  apiRequest(`/users/${id}`, { method: "PUT", body: user, fallbackError: "No se pudo guardar el usuario" });

export const getUserClosurePreview = (id) =>
  apiRequest(`/users/${id}/closure-preview`, { fallbackError: "No se pudieron revisar los turnos del cliente" });

export const deactivateUser = (id) =>
  apiRequest(`/users/${id}/deactivate`, { method: "POST", fallbackError: "No se pudo desactivar la cuenta" });

export const activateUser = (id) =>
  apiRequest(`/users/${id}/activate`, { method: "POST", fallbackError: "No se pudo reactivar la cuenta" });

export const deleteUser = (id) =>
  apiRequest(`/users/${id}`, { method: "DELETE", fallbackError: "No se pudo eliminar la cuenta" });
