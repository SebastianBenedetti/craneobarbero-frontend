import { useEffect } from "react";
import ReviewsPanel from "../../components/ReviewList/ReviewsPanel";
import "../../styles/myAccount.css";
import "../../styles/adminDashboard.css";

function BarberReviewsPage() {
  useEffect(() => {
    document.title = " Mis reseñas | Panel Barbero";
  }, []);

  return (
    <div className="account-page page-transition">
      <h1 className="account-title">Mis reseñas</h1>
      <p className="text-secondary">Las calificaciones que te dejaron tus clientes después de cada turno.</p>
      <ReviewsPanel />
    </div>
  );
}

export default BarberReviewsPage;
