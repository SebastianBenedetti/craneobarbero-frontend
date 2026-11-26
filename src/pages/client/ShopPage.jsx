import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";
import useBranches from "../../hooks/useBranches";
import { MAX_CART_PRODUCTS, MAX_CART_QUANTITY } from "../../context/CartProvider";
import { createOrder, getCategories, getProducts } from "../../services/store.services";
import { resendVerificationEmail } from "../../services/appointments.services";
import { formatMoney } from "../../utils/format";
import "../../styles/store.css";

function ShopPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const canBuy = user?.role === "client";
  const [searchParams] = useSearchParams();
  const focusedId = Number(searchParams.get("product")) || null;
  const cart = useCart();
  const { syncProducts } = cart;
  const branches = useBranches();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(() => searchParams.get("category") ?? "");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branchId, setBranchId] = useState("");
  const [checkoutError, setCheckoutError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [resendState, setResendState] = useState("");
  const [added, setAdded] = useState(null);

  useEffect(() => {
    document.title = " Tienda | Cráneo Barbero";
  }, []);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([productList, categoryList]) => {
        setProducts(productList);
        setCategories(categoryList);
        syncProducts(productList);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [syncProducts]);

  useEffect(() => {
    if (loading || !focusedId) return;
    document.getElementById(`product-${focusedId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [loading, focusedId]);

  useEffect(() => {
    if (!added) return undefined;
    const timer = setTimeout(() => setAdded(null), 1500);
    return () => clearTimeout(timer);
  }, [added]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) =>
      (!categoryId || p.categoryId === Number(categoryId)) &&
      (!term || p.name.toLowerCase().includes(term) || (p.description ?? "").toLowerCase().includes(term)));
  }, [products, categoryId, search]);

  const productById = (id) => products.find((p) => p.id === id);
  const unavailable = cart.items.filter((i) => {
    const product = productById(i.productId);
    return !loading && (!product || !product.inStock);
  });

  const goToLogin = (view) => {
    navigate("/login", { state: { from: `${location.pathname}${location.search}`, view } });
  };

  const add = (product) => {
    if (!user) {
      goToLogin();
      return;
    }
    cart.addItem(product);
    setAdded(product.id);
    setCheckoutError(null);
  };

  const checkout = async () => {
    setCheckoutError(null);
    if (!branchId) {
      setCheckoutError({ message: "Elegí la sucursal donde vas a retirar el pedido." });
      return;
    }
    setPaying(true);
    try {
      const { order, checkoutUrl } = await createOrder(
        Number(branchId),
        cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      );
      cart.clear();
      if (checkoutUrl) window.location.assign(checkoutUrl);
      else navigate("/my-account/purchases", { state: { notice: `Tu pedido #${order.id} quedó esperando el pago. Tocá "Pagar" para continuar.` } });
    } catch (err) {
      setCheckoutError({ message: err.message, code: err.code });
      setPaying(false);
    }
  };

  const resend = async () => {
    setResendState("sending");
    try {
      await resendVerificationEmail();
      setResendState("sent");
    } catch (err) {
      setResendState(err.message);
    }
  };

  const activeBranches = branches.filter((b) => b.isActive !== false);

  return (
    <div className="shop-page page-transition">
      <header className="shop-header">
        <h1 className="shop-title">Tienda</h1>
        <p className="text-secondary mb-0">Comprá online y retirá en la sucursal que elijas. El pago es por Mercado Pago.</p>
      </header>

      <div className="shop-layout">
        <section aria-label="Productos">
          <div className="shop-toolbar">
            <input
              type="search"
              className="form-control bg-secondary text-white border-secondary"
              placeholder="Buscar productos"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Buscar productos"
            />
            <div className="shop-categories" role="group" aria-label="Categorías">
              <button className={`shop-chip ${categoryId === "" ? "active" : ""}`} onClick={() => setCategoryId("")}>Todas</button>
              {categories.map((c) => (
                <button key={c.id} className={`shop-chip ${categoryId === String(c.id) ? "active" : ""}`} onClick={() => setCategoryId(String(c.id))}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {loading && <p className="text-secondary">Cargando productos...</p>}
          {error && <p className="text-danger">{error}</p>}
          {!loading && !error && visible.length === 0 && (
            <p className="text-secondary">{products.length === 0 ? "Todavía no hay productos a la venta." : "No hay productos con esos filtros."}</p>
          )}

          <div className="shop-grid">
            {visible.map((product) => {
              const inCart = cart.items.find((i) => i.productId === product.id);
              return (
                <article
                  key={product.id}
                  id={`product-${product.id}`}
                  className={`shop-card ${product.inStock ? "" : "shop-card-out"} ${product.id === focusedId ? "shop-card-focused" : ""}`}
                >
                  <div className="shop-card-image">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} loading="lazy" onError={(e) => { e.target.style.display = "none"; }} />
                      : <span aria-hidden="true">✂</span>}
                  </div>
                  <div className="shop-card-body">
                    <span className="shop-card-category">{product.category?.name}</span>
                    <h2 className="shop-card-name">{product.name}</h2>
                    {product.description && <p className="shop-card-description">{product.description}</p>}
                    <div className="shop-card-footer">
                      <span className="shop-card-price">{formatMoney(product.salePrice)}</span>
                      {user && !canBuy ? null : product.inStock ? (
                        <button
                          className="btn btn-warning text-dark btn-sm"
                          onClick={() => add(product)}
                          disabled={(inCart?.quantity ?? 0) >= MAX_CART_QUANTITY || (!inCart && cart.items.length >= MAX_CART_PRODUCTS)}
                          aria-label={`Agregar ${product.name} al carrito`}
                        >
                          {added === product.id ? "¡Agregado!" : inCart ? `Agregar otro (${inCart.quantity})` : "Agregar"}
                        </button>
                      ) : (
                        <span className="shop-out-label">Sin stock</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside className="shop-cart" aria-label="Carrito">
          <h2 className="shop-cart-title">Tu carrito {canBuy && cart.count > 0 && <span className="text-secondary">({cart.count})</span>}</h2>

          {!user ? (
            <>
              <p className="text-secondary">Para comprar tenés que iniciar sesión.</p>
              <button className="btn btn-warning text-dark w-100" onClick={() => goToLogin()}>Iniciar sesión</button>
              <button className="btn btn-outline-light w-100 mt-2" onClick={() => goToLogin("register")}>Crear cuenta</button>
            </>
          ) : !canBuy ? (
            <p className="text-secondary mb-0">Las compras online son solo para clientes.</p>
          ) : cart.items.length === 0 ? (
            <p className="text-secondary mb-0">Todavía no agregaste productos.</p>
          ) : (
            <>
              <ul className="shop-cart-items">
                {cart.items.map((item) => {
                  const isUnavailable = unavailable.includes(item);
                  return (
                    <li key={item.productId} className={isUnavailable ? "shop-cart-item-out" : ""}>
                      <div className="shop-cart-item-name">
                        <span>{item.name}</span>
                        {isUnavailable && <span className="text-danger small">Ya no está disponible</span>}
                      </div>
                      <div className="shop-cart-item-controls">
                        <div className="shop-qty" role="group" aria-label={`Cantidad de ${item.name}`}>
                          <button onClick={() => cart.setQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Restar uno">−</button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button onClick={() => cart.setQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= MAX_CART_QUANTITY} aria-label="Sumar uno">+</button>
                        </div>
                        <span className="shop-cart-item-subtotal">{formatMoney(item.quantity * Number(item.salePrice))}</span>
                        <button className="shop-cart-remove" onClick={() => cart.removeItem(item.productId)} aria-label={`Quitar ${item.name}`}>✕</button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="shop-cart-total">
                <span>Total</span>
                <strong>{formatMoney(cart.total)}</strong>
              </div>

              <label htmlFor="shop-branch" className="admin-form-label mt-3">Retirás en</label>
              <select
                id="shop-branch"
                className="form-select bg-secondary text-white border-secondary"
                value={branchId}
                onChange={(e) => { setBranchId(e.target.value); setCheckoutError(null); }}
              >
                <option value="">Elegí una sucursal</option>
                {activeBranches.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.address}</option>)}
              </select>

              <p className="text-secondary small mt-2 mb-0">
                Tenés 30 minutos para completar el pago. El stock se confirma cuando se acredita el pago.
              </p>

              {checkoutError && (
                <div className="alert alert-danger py-2 mt-3 mb-0 small" role="alert">
                  {checkoutError.message}
                  {checkoutError.code === "email_not_verified" && (
                    <div className="mt-2">
                      <button className="btn btn-sm btn-outline-light" onClick={resend} disabled={resendState === "sending" || resendState === "sent"}>
                        {resendState === "sent" ? "Mail enviado" : "Reenviar el mail de verificación"}
                      </button>
                      {resendState && !["sending", "sent"].includes(resendState) && <div className="mt-1">{resendState}</div>}
                    </div>
                  )}
                </div>
              )}

              <button
                className="btn btn-warning text-dark w-100 mt-3"
                onClick={checkout}
                disabled={paying || unavailable.length > 0}
              >
                {paying ? "Abriendo el pago…" : "Pagar con Mercado Pago"}
              </button>
              {unavailable.length > 0 && <p className="text-danger small mt-2 mb-0">Quitá los productos que ya no están disponibles para continuar.</p>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ShopPage;
