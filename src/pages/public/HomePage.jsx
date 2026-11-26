import "../../styles/home.css";
import "../../styles/animations.css";

import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { getCategories } from "../../services/store.services";

const PANEL_BY_ROLE = { admin: "/admin", barber: "/barber" };

function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  useEffect(() => {
    document.title = " Inicio | Cráneo Barbero";
  }, []);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const goToShop = (categoryId) => {
    navigate(categoryId ? `/shop?category=${categoryId}` : "/shop");
  };

  const panel = PANEL_BY_ROLE[user?.role];
  if (panel) {
    return <Navigate to={panel} replace />;
  }

  return (
    <div className="home-container page-transition">
      <section id="hero" className="hero">
        <img
          src="/images/LogoHomePage-removebg.png"
          className="hero-logo"
          alt="logo"
        />
        <span className="hero-badge">Desde 2020 en Rosario</span>
        <h1 className="hero-h1">
          Tu mejor versión,{" "}
          <span className="text-gold">siempre a un turno</span> de distancia
        </h1>
        <p className="hero-subtitle">
          Cuatro sucursales en Rosario y alrededores. Forjador de imagen.
          Reservá en segundos, sin esperas.
        </p>
        <div className="hero-cta">
          <h2 className="hero-cta-title">¿Listo para tu próximo corte?</h2>
          <p className="hero-cta-subtitle">
            Elegí sucursal, barbero de confianza, día y hora en menos de un
            minuto
          </p>
          <button className="btn-cta" onClick={() => navigate("/appointment")}>
            <i className="ti ti-scissors"></i>
            Sacar turno ahora
          </button>
        </div>

        <div className="home-divider" aria-hidden="true" />

        <div className="hero-cta home-store">
          <h2 className="hero-cta-title">Nuestra tienda</h2>
          <p className="hero-cta-subtitle">
            Seleccionados entre los mejores productos del mercado
          </p>
          <button className="btn-cta" onClick={() => goToShop()}>
            <i className="ti ti-shopping-bag"></i>
            Visitar la tienda
          </button>
          {categories.length > 0 && (
            <div className="home-store-categories">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className="home-store-chip"
                  onClick={() => goToShop(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
