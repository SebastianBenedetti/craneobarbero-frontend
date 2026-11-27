import { useEffect, useState } from "react";
import { getMyClients } from "../../services/account.services";
import "../../styles/myAccount.css";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });

function BarberClientsPage() {
  const [clients, setClients] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "Mis clientes | Panel Barbero";
    getMyClients().then(setClients).catch((err) => setError(err.message));
  }, []);

  const term = search.trim().toLowerCase();
  const visible = (clients ?? []).filter((c) => !term || c.name.toLowerCase().includes(term));

  return (
    <div className="account-page page-transition">
      <h1 className="account-title">Mis clientes</h1>
      <p className="text-secondary">
        Clientes con cuenta que se atendieron o tienen turno con vos, de los más regulares a los menos.
      </p>

      {error && <p className="text-danger" role="alert">{error}</p>}
      {!clients && !error && <p className="text-secondary">Cargando…</p>}

      {clients && (
        <>
          <label className="visually-hidden" htmlFor="clients-search">Buscar cliente</label>
          <input
            id="clients-search"
            type="search"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-control bg-secondary text-white border-secondary mb-3"
          />
          {visible.length === 0 ? (
            <p className="text-secondary">{clients.length === 0 ? "Todavía no tenés clientes con cuenta." : "No hay clientes con ese nombre."}</p>
          ) : (
            <ul className="clients-list">
              {visible.map((c) => (
                <li key={c.id} className="clients-item">
                  <div>
                    <p className="clients-item-name">{c.name}</p>
                    <p className="clients-item-meta">
                      Teléfono: {c.phone ? <a className="text-warning" href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`}>{c.phone}</a> : "—"}
                    </p>
                    <p className="clients-item-meta">
                      Último turno: {c.lastAppointmentDate ? formatDate(c.lastAppointmentDate) : "—"}
                      {c.nextAppointmentDate && ` · Próximo: ${formatDate(c.nextAppointmentDate)}`}
                    </p>
                  </div>
                  <div className="clients-item-count">
                    {c.completedAppointments}
                    <small>{c.completedAppointments === 1 ? "turno realizado" : "turnos realizados"}</small>
                    {c.upcomingAppointments > 0 && (
                      <small>{c.upcomingAppointments === 1 ? "1 próximo" : `${c.upcomingAppointments} próximos`}</small>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default BarberClientsPage;
