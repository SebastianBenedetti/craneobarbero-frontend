import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { CartContext } from "./cartContext";

export const MAX_CART_QUANTITY = 100;
export const MAX_CART_PRODUCTS = 30;

const storageKey = (user) => (user?.role === "client" ? `barberia-cart-${user.id}` : null);

const readCart = (key) => {
  if (!key) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const key = storageKey(user);
  const [cart, setCart] = useState(() => ({ key, items: readCart(key) }));
  if (cart.key !== key) setCart({ key, items: readCart(key) });
  const items = cart.items;

  useEffect(() => {
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(items));
    } catch {
      return;
    }
  }, [key, items]);

  const update = useCallback((change) => setCart((prev) => ({ key: prev.key, items: change(prev.items) })), []);

  const addItem = useCallback((product, quantity = 1) => update((current) => {
    const existing = current.find((i) => i.productId === product.id);
    if (existing) {
      return current.map((i) => i.productId === product.id
        ? { ...i, quantity: Math.min(MAX_CART_QUANTITY, i.quantity + quantity) }
        : i);
    }
    if (current.length >= MAX_CART_PRODUCTS) return current;
    return [...current, { productId: product.id, name: product.name, salePrice: product.salePrice, imageUrl: product.imageUrl, quantity }];
  }), [update]);

  const setQuantity = useCallback((productId, quantity) => update((current) =>
    current.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(MAX_CART_QUANTITY, quantity)) } : i))
  ), [update]);

  const removeItem = useCallback((productId) => update((current) => current.filter((i) => i.productId !== productId)), [update]);

  const syncProducts = useCallback((products) => update((current) => current.map((i) => {
    const product = products.find((p) => p.id === i.productId);
    return product ? { ...i, name: product.name, salePrice: product.salePrice, imageUrl: product.imageUrl } : i;
  })), [update]);

  const clear = useCallback(() => update(() => []), [update]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((sum, i) => sum + i.quantity, 0),
    total: items.reduce((sum, i) => sum + i.quantity * Number(i.salePrice), 0),
    addItem,
    setQuantity,
    removeItem,
    syncProducts,
    clear,
  }), [items, addItem, setQuantity, removeItem, syncProducts, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
