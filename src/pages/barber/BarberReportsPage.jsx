import { useEffect, useState } from "react";
import PieChart from "../../components/PieChart/PieChart";
import ReportFilters, { IncomeBars, StatCard } from "../../components/ReportFilters/ReportFilters";
import { getBarberClients, getBarberPeriods, getBarberServices, getBarberSummary } from "../../services/reports.services";
import { currentMonthPeriod } from "../../utils/dates";
import { appointmentStatusNames, formatMoney, formatTurns } from "../../utils/format";
import "../../styles/adminDashboard.css";
import "../../styles/reports.css";

function BarberReportsPage() {
  const [filters, setFilters] = useState(currentMonthPeriod());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = " Mis reportes | Panel de barbero";
  }, []);

  useEffect(() => {
    if (!filters.from || !filters.to) return;
    let cancelled = false;
    Promise.all([getBarberSummary(filters), getBarberServices(filters), getBarberClients(filters), getBarberPeriods(filters)])
      .then(([summary, services, clients, periods]) => {
        if (!cancelled) {
          setData({ summary, services, clients, periods });
          setError("");
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters]);

  const summary = data?.summary;

  return (
    <div className="admin-dashboard page-transition">
      <div className="admin-dashboard-header">
        <h1 className="admin-title">Mis reportes</h1>
        <p className="admin-subtitle">Tus ingresos, servicios y clientes más regulares</p>
      </div>

      <ReportFilters value={filters} onChange={(next) => { setLoading(true); setFilters(next); }} />

      {loading && <p className="text-secondary">Cargando...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && data && (
        <>
          <div className="report-stats">
            <StatCard label="Ingresos" value={formatMoney(summary.income)} hint={`${summary.incomeCount} turnos cobrados`} />
            <StatCard label="Turnos completados" value={summary.completed} />
            <StatCard label="Pagados por adelantado" value={formatMoney(summary.prepaid.amount)} hint={`${summary.prepaid.count} turnos futuros`} />
            <StatCard label="Cancelados" value={summary.byStatus.cancelled} hint={`${summary.byStatus.pending} pendientes`} />
          </div>

          <div className="admin-section">
            <div className="report-pies">
              <PieChart
                title="Mis turnos por estado"
                format={formatTurns}
                data={Object.entries(summary.byStatus).map(([status, count]) => ({ label: appointmentStatusNames[status] ?? status, value: count }))}
              />
              <PieChart
                title="Servicios realizados"
                format={formatTurns}
                data={data.services.map((s) => ({ label: s.name, value: s.completed }))}
              />
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Ingresos por período</h2>
            </div>
            <IncomeBars rows={data.periods} />
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Servicios más realizados</h2>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>Servicio</th><th>Realizados</th><th>Ingresos</th></tr></thead>
                <tbody>
                  {data.services.length === 0 ? (
                    <tr><td colSpan={3} className="text-secondary text-center">Sin datos en el período.</td></tr>
                  ) : data.services.map((s) => (
                    <tr key={s.cutId}><td>{s.name}</td><td>{s.completed}</td><td>{formatMoney(s.income)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Clientes más regulares</h2>
            </div>
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>Cliente</th><th>Turnos completados</th><th>Último turno</th></tr></thead>
                <tbody>
                  {data.clients.length === 0 ? (
                    <tr><td colSpan={3} className="text-secondary text-center">Sin turnos completados en el período.</td></tr>
                  ) : data.clients.map((c) => (
                    <tr key={c.clientId ?? c.name}>
                      <td>{c.name}</td>
                      <td>{c.completed}</td>
                      <td>{new Date(c.lastAppointmentDate).toLocaleDateString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default BarberReportsPage;
