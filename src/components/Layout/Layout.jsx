import "../../styles/layout.css";
import { useLocation, useNavigate, Outlet } from "react-router";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import BookingAssistant from "../BookingAssistant/BookingAssistant";
import { useAuth } from "../../hooks/useAuth";
import { useTapToReveal } from "../../hooks/useTapToReveal";

function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fab = useTapToReveal(() => navigate("/appointment"));
  const showFab =
    user?.role !== "admin" &&
    user?.role !== "barber" &&
    location.pathname !== "/appointment";

  return (
    <div className="layout page-transition">
      <Navbar />
      <main className="layout-main">
        <Outlet />
      </main>
      {user?.role !== "barber" && user?.role !== "admin" && <Footer />}
      {showFab && (
        <button
          className={`fab-appointment${fab.revealed ? " is-revealed" : ""}`}
          onPointerDown={fab.onPointerDown}
          onClick={fab.onClick}
          title="Sacar turno"
          aria-label="Sacar turno"
        >
          <span className="fab-label">Sacar turno</span>
          <i className="ti ti-scissors" />
        </button>
      )}
      {(!user || user.role === "client") && (
        <BookingAssistant key={user?.id ?? "guest"} guest={!user} bottomOffset={showFab} />
      )}
    </div>
  );
}

export default Layout;
