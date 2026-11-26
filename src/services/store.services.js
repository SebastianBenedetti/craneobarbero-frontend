import { apiRequest } from "./api";

const toQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : "";
};

export const getCategories = () =>
  apiRequest("/categories", { fallbackError: "No se pudieron cargar las categorías" });

export const createCategory = (name) =>
  apiRequest("/categories", { method: "POST", body: { name }, fallbackError: "No se pudo crear la categoría" });

export const updateCategory = (id, name) =>
  apiRequest(`/categories/${id}`, { method: "PUT", body: { name }, fallbackError: "No se pudo actualizar la categoría" });

export const getProducts = (filters) =>
  apiRequest(`/products${toQuery(filters)}`, { fallbackError: "No se pudieron cargar los productos" });

export const createProduct = (body) =>
  apiRequest("/products", { method: "POST", body, fallbackError: "No se pudo crear el producto" });

export const updateProduct = (id, body) =>
  apiRequest(`/products/${id}`, { method: "PUT", body, fallbackError: "No se pudo actualizar el producto" });

export const getSuppliers = (active) =>
  apiRequest(`/suppliers${toQuery({ active })}`, { fallbackError: "No se pudieron cargar los proveedores" });

export const createSupplier = (body) =>
  apiRequest("/suppliers", { method: "POST", body, fallbackError: "No se pudo crear el proveedor" });

export const updateSupplier = (id, body) =>
  apiRequest(`/suppliers/${id}`, { method: "PUT", body, fallbackError: "No se pudo actualizar el proveedor" });

export const adjustStock = (body) =>
  apiRequest("/stock/movements", { method: "POST", body, fallbackError: "No se pudo registrar el ajuste" });

export const getStockMovements = (filters) =>
  apiRequest(`/stock/movements${toQuery(filters)}`, { fallbackError: "No se pudieron cargar los movimientos" });

export const registerPurchase = (body) =>
  apiRequest("/stock/purchases", { method: "POST", body, fallbackError: "No se pudo registrar la compra" });

export const getStockAlerts = () =>
  apiRequest("/stock/alerts", { fallbackError: "No se pudieron cargar las alertas de stock" });

export const getStockValuation = () =>
  apiRequest("/stock/valuation", { fallbackError: "No se pudo cargar la valorización" });

export const getReorderList = () =>
  apiRequest("/stock/reorder", { fallbackError: "No se pudo cargar la lista para reponer" });

export const createOrder = (branchId, items) =>
  apiRequest("/orders", { method: "POST", body: { branchId, items }, fallbackError: "No se pudo crear el pedido" });

export const payOrder = (id) =>
  apiRequest(`/orders/${id}/pay`, { method: "POST", fallbackError: "No se pudo iniciar el pago" });

export const getMyOrders = (page = 1, pageSize = 20) =>
  apiRequest(`/orders/mine${toQuery({ page, pageSize })}`, { fallbackError: "No se pudieron cargar tus compras" });

export const getOrders = (filters) =>
  apiRequest(`/orders${toQuery(filters)}`, { fallbackError: "No se pudieron cargar los pedidos" });

export const updateOrderStatus = (id, status) =>
  apiRequest(`/orders/${id}/status`, { method: "PUT", body: { status }, fallbackError: "No se pudo cambiar el estado" });

export const cancelOrder = (id, refund, reason) =>
  apiRequest(`/orders/${id}/cancel`, {
    method: "POST",
    body: { refund, reason: reason || undefined },
    fallbackError: "No se pudo cancelar el pedido",
  });
