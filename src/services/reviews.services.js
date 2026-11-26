import { apiRequest } from "./api";

const toQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const createReview = (appointmentId, body) =>
  apiRequest(`/appointments/${appointmentId}/review`, { method: "POST", body, fallbackError: "No se pudo guardar la calificación" });

export const getMyReviews = () =>
  apiRequest("/reviews/mine", { fallbackError: "No se pudieron cargar tus calificaciones" });

export const getReviews = (filters) =>
  apiRequest(`/reviews${toQuery(filters)}`, { fallbackError: "No se pudieron cargar las reseñas" });
