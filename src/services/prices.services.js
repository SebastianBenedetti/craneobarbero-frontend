import { apiRequest } from "./api";

export const getInflationSuggestion = (from, to) => {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return apiRequest(`/prices/inflation-suggestion${query ? `?${query}` : ""}`, {
    fallbackError: "No se pudo consultar la inflación",
  });
};

export const previewPriceAdjustment = (body) =>
  apiRequest("/prices/adjustments/preview", { method: "POST", body, fallbackError: "No se pudo calcular la vista previa" });

export const applyPriceAdjustment = (body) =>
  apiRequest("/prices/adjustments", { method: "POST", body: { ...body, confirm: true }, fallbackError: "No se pudo aplicar el ajuste" });

export const getPriceAdjustments = () =>
  apiRequest("/prices/adjustments", { fallbackError: "No se pudieron cargar los ajustes" });

export const revertPriceAdjustment = (id) =>
  apiRequest(`/prices/adjustments/${id}/revert`, { method: "POST", fallbackError: "No se pudo revertir el ajuste" });

export const getProductCategories = () =>
  apiRequest("/categories", { fallbackError: "No se pudieron cargar las categorías" });

export const getAdminProducts = () =>
  apiRequest("/products?active=true", { fallbackError: "No se pudieron cargar los productos" });
