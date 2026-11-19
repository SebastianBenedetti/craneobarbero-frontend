import { useEffect } from "react";
import AgendaSection from "./sections/AgendaSection";
import "../../styles/adminDashboard.css";

function AdminAgendaPage() {
  useEffect(() => {
    document.title = " Agenda | Panel Admin";
  }, []);

  return (
    <div className="admin-dashboard page-transition">
      <div className="admin-dashboard-header">
        <h1 className="admin-title">Agenda</h1>
        <p className="admin-subtitle">Horarios, feriados y días no laborables de todas las sucursales</p>
      </div>
      <AgendaSection />
    </div>
  );
}

export default AdminAgendaPage;
