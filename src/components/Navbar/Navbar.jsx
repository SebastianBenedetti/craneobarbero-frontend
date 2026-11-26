import "../../styles/navbar.css";
import { Link, useLocation } from "react-router";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import useCart from "../../hooks/useCart";

function Navbar() {
  const { user, logout } = useAuth();
  const { count: cartCount } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const isActive = (path) =>
    location.pathname === path ? "navbar-link-active" : "";

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("nav-menu-open", menuOpen);
    return () => document.body.classList.remove("nav-menu-open");
  }, [menuOpen]);

  const [lastPath, setLastPath] = useState(location.pathname);
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setMenuOpen(false);
    setDropdownOpen(false);
  }

  const handleLogout = () => {
    logout();
    window.location.assign("/");
  };

  const closeAll = () => {
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  return (
    <nav className="custom-navbar">
      <div className="navbar-brand">
        <span className="navbar-title">Barbería Cráneo Barbero</span>
      </div>

      <button
        className={`navbar-hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Menú"
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}>
        {/* Acá se ve si no hay usuario o cliente logueado. Si no inició sesion se muestra la navbar común */}
        {(!user || user.role === "client") && (
          <>
            <Link to="/appointment" className="navbar-cta">
              Sacar turno
            </Link>
            <Link to="/">Inicio</Link>
            <Link to="/shop" className={isActive("/shop")}>
              Tienda
              {user && cartCount > 0 && (
                <span className="navbar-cart-count" aria-label={`${cartCount} productos en el carrito`}>{cartCount}</span>
              )}
            </Link>
            <Link to="/about">Nosotros</Link>
          </>
        )}

        {/* Se ve si el usuario logueado es barbero */}
        {user?.role === "barber" && (
          <>
            <span className="navbar-panel-label">Panel de barbero</span>
            <Link to="/barber" className={isActive("/barber")}>
              Inicio
            </Link>
            <Link
              to="/barber/schedule"
              className={isActive("/barber/schedule")}
            >
              Mi agenda
            </Link>
            <Link to="/barber/clients" className={isActive("/barber/clients")}>
              Mis clientes
            </Link>
            <Link to="/barber/reports" className={isActive("/barber/reports")}>
              Mis reportes
            </Link>
            <Link to="/barber/reviews" className={isActive("/barber/reviews")}>
              Mis reseñas
            </Link>
          </>
        )}

        {/* Se ve si el usuario logueado es admin */}
        {user?.role === "admin" && (
          <>
            <Link to="/admin" className={isActive("/admin")}>
              Inicio
            </Link>
            <Link to="/admin/agenda" className={isActive("/admin/agenda")}>
              Agenda
            </Link>
            <Link to="/admin/store" className={isActive("/admin/store")}>
              Tienda
            </Link>
            <Link to="/admin/prices" className={isActive("/admin/prices")}>
              Precios
            </Link>
            <Link to="/admin/reports" className={isActive("/admin/reports")}>
              Reportes
            </Link>
            <Link to="/admin/manage" className={isActive("/admin/manage")}>
              Gestionar
            </Link>
          </>
        )}

        {/* Sección de autenticación, cambia segun quien sea */}
        {user?.role === "barber" ? (
          <div className="navbar-account" ref={dropdownRef}>
            <button
              className="navbar-account-btn"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              {user.name}{" "}
              <span className="navbar-chevron">{dropdownOpen ? "▴" : "▾"}</span>
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown">
                <Link to="/my-account" onClick={closeAll}>
                  Mi cuenta
                </Link>
                <button className="navbar-dropdown-logout" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : user?.role === "admin" ? (
          // dropdown de mi cuenta para el admin
          <div className="navbar-account" ref={dropdownRef}>
            <button
              className="navbar-account-btn"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              Mi Cuenta{" "}
              <span className="navbar-chevron">{dropdownOpen ? "▴" : "▾"}</span>
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown">
                <Link to="/my-account" onClick={closeAll}>
                  Mi cuenta
                </Link>
                <button
                  className="navbar-dropdown-logout"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : user ? (
          <div className="navbar-account" ref={dropdownRef}>
            <button
              className="navbar-account-btn"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              Hola, {user.name}{" "}
              <span className="navbar-chevron">{dropdownOpen ? "▴" : "▾"}</span>
            </button>
            {dropdownOpen && (
              <div className="navbar-dropdown">
                <Link to="/my-account/appointments" onClick={closeAll}>
                  Mis turnos
                </Link>
                <Link to="/my-account/purchases" onClick={closeAll}>
                  Mis compras
                </Link>
                <Link to="/my-account" onClick={closeAll}>
                  Mi cuenta
                </Link>
                <button
                  className="navbar-dropdown-logout"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">Iniciar sesión</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
