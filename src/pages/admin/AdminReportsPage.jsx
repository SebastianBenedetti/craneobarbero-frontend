import { useEffect, useState } from "react";
import ReportFilters, { IncomeBars, StatCard } from "../../components/ReportFilters/ReportFilters";
import PieChart from "../../components/PieChart/PieChart";
import Toast from "../../components/Toast/Toast";
import { apiRequest } from "../../services/api";
import {
  downloadAdminReport,
  downloadAiReport,
  getAdminBarbers,
  getAdminBranches,
  getAdminPeriods,
  getAdminProducts,
  getAdminServices,
  getAdminSummary,
} from "../../services/reports.services";
import { currentMonthPeriod } from "../../utils/dates";
import { shareSummaryImage } from "../../utils/shareImage";
import { appointmentStatusNames, formatMoney, formatPercent, formatTurns, plural } from "../../utils/format";
import "../../styles/adminDashboard.css";
import "../../styles/reports.css";

function ReportTable({ title, headers, rows, empty = "Sin datos en el período." }) {
  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">{title}</h2>
      </div>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length} className="text-secondary text-center">{empty}</td></tr>
            ) : (
              rows.map((row) => (
                <tr key={row.key}>{row.cells.map((cell, i) => <td key={i}>{cell}</td>)}</tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function periodLabel(from, to) {
  const month = (value) => value.slice(5, 7) + "-" + value.slice(0, 4);
  return from.slice(0, 7) === to.slice(0, 7) ? month(to) : `${month(from)} a ${month(to)}`;
}

function AdminReportsPage() {
  const [filters, setFilters] = useState({ ...currentMonthPeriod(), branchId: "" });
  const [branches, setBranches] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.title = "Reportes | Panel Admin";
    apiRequest("/branches?includeInactive=true", { fallbackError: "No se pudieron cargar las sucursales" })
      .then(setBranches)
      .catch(() => setBranches([]));
  }, []);

  useEffect(() => {
    if (!filters.from || !filters.to) return;
    let cancelled = false;
    Promise.all([
      getAdminSummary(filters),
      getAdminBranches(filters),
      getAdminBarbers(filters),
      getAdminServices(filters),
      getAdminProducts(filters),
      getAdminPeriods(filters),
    ])
      .then(([summary, byBranch, byBarber, byService, byProduct, byPeriod]) => {
        if (!cancelled) {
          setData({ summary, byBranch, byBarber, byService, byProduct, byPeriod });
          setError("");
        }
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [filters]);

  const changeFilters = (next) => {
    setLoading(true);
    setFilters(next);
  };

  const download = async (format) => {
    setDownloading(format);
    try {
      await downloadAdminReport(format, filters);
    } catch (err) {
      setToast({ message: err.message, type: "danger" });
    } finally {
      setDownloading("");
    }
  };

  const downloadAi = async () => {
    setDownloading("ai");
    try {
      const aiGenerated = await downloadAiReport(filters);
      setToast(aiGenerated
        ? { message: "Reporte con IA generado.", type: "success" }
        : { message: "La IA no estaba disponible: el reporte se armó con recomendaciones automáticas.", type: "warning" });
    } catch (err) {
      setToast({ message: err.message, type: "danger" });
    } finally {
      setDownloading("");
    }
  };

  const shareImage = async () => {
    if (!data) return;
    setDownloading("image");
    try {
      const top = [...data.byService].sort((a, b) => b.completed - a.completed)[0];
      const label = periodLabel(filters.from, filters.to);
      await shareSummaryImage({
        periodLabel: label,
        fileName: `Reporte ${label} - Craneo Barbero.png`,
        stats: [
          { value: String(data.summary.appointments.completed), label: "cortes realizados" },
          { value: top && top.completed > 0 ? top.name : "-", label: "el servicio más elegido" },
          { value: String(data.summary.products.units), label: "productos vendidos" },
        ],
      });
    } catch (err) {
      setToast({ message: err.message, type: "danger" });
    } finally {
      setDownloading("");
    }
  };

  const summary = data?.summary;
  const appointments = summary?.appointments;
  const products = summary?.products;

  return (
    <div className="admin-dashboard page-transition">
      <div className="admin-dashboard-header">
        <h1 className="admin-title">Reportes</h1>
        <p className="admin-subtitle">Ingresos de turnos y productos según las reglas del negocio</p>
      </div>

      <ReportFilters value={filters} onChange={changeFilters} branches={branches}>
        <div className="report-actions">
          <button type="button" className="btn btn-warning text-dark" disabled={!!downloading} onClick={downloadAi}
            title="Análisis con estrategias y reseñas (máximo dos años)">
            <i className="ti ti-sparkles" aria-hidden="true" /> {downloading === "ai" ? "Analizando..." : "Reporte con IA"}
          </button>
          <button type="button" className="btn btn-outline-warning" disabled={!!downloading} onClick={() => download("pdf")}>
            {downloading === "pdf" ? "Generando..." : "Exportar PDF"}
          </button>
          <button type="button" className="btn btn-outline-warning" disabled={!!downloading} onClick={() => download("xlsx")}>
            {downloading === "xlsx" ? "Generando..." : "Exportar Excel"}
          </button>
          <button type="button" className="btn btn-outline-warning" disabled={!!downloading || !data} onClick={shareImage}
            title="Imagen para compartir" aria-label="Imagen para compartir">
            {downloading === "image" ? "Generando..." : "Imagen"} <i className="ti ti-share" aria-hidden="true" />
          </button>
        </div>
      </ReportFilters>

      {loading && <p className="text-secondary">Cargando...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && data && (
        <>
          <div className="report-stats">
            <StatCard label="Ingreso total" value={formatMoney(summary.totalIncome)} hint="Turnos y productos" />
            <StatCard label="Ingresos por turnos" value={formatMoney(appointments.income)}
              hint={`${plural(appointments.incomeCount, "turno", "turnos")} (${plural(appointments.lateCancellationsCharged, "cancelación tardía cobrada", "cancelaciones tardías cobradas")})`} />
            <StatCard label="Pagados por adelantado" value={formatMoney(appointments.prepaid.amount)}
              hint={`${plural(appointments.prepaid.count, "turno futuro", "turnos futuros")}, todavía no cuentan`} />
            <StatCard label="Ventas de productos" value={formatMoney(products.income)} hint={`${plural(products.orders, "pedido", "pedidos")} · ${plural(products.units, "unidad", "unidades")}`} />
            <StatCard label="Ganancia de productos" value={formatMoney(products.profit)} hint={`Costo ${formatMoney(products.cost)}`} />
            <StatCard label="Turnos completados" value={appointments.completed}
              hint={`${appointments.byStatus.cancelled} cancelados · ${appointments.byStatus.expired} expirados`} />
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Distribución</h2>
            </div>
            <div className="report-pies">
              <PieChart
                title="Turnos por estado"
                format={formatTurns}
                data={Object.entries(appointments.byStatus).map(([status, count]) => ({ label: appointmentStatusNames[status] ?? status, value: count }))}
              />
              <PieChart
                title="Origen de los ingresos"
                format={formatMoney}
                data={[{ label: "Turnos", value: appointments.income }, { label: "Productos", value: products.income }]}
              />
              <PieChart
                title="Ingresos por sucursal"
                format={formatMoney}
                data={data.byBranch.map((b) => ({ label: b.name, value: b.totalIncome }))}
              />
              <PieChart
                title="Servicios realizados"
                format={formatTurns}
                data={data.byService.map((s) => ({ label: s.name, value: s.completed }))}
              />
            </div>
          </div>

          <div className="admin-section">
            <div className="admin-section-header">
              <h2 className="admin-section-title">Ingresos por período</h2>
            </div>
            <IncomeBars rows={data.byPeriod} />
          </div>

          <ReportTable
            title="Por sucursal"
            headers={["Sucursal", "Turnos", "Completados", "Productos", "Ganancia productos", "Total"]}
            rows={data.byBranch.map((b) => ({
              key: b.branchId,
              cells: [b.name, formatMoney(b.appointmentIncome), b.appointmentsCompleted, formatMoney(b.productIncome),
                formatMoney(b.productProfit), formatMoney(b.totalIncome)],
            }))}
          />

          <ReportTable
            title="Por barbero"
            headers={["Barbero", "Sucursal", "Ingresos", "Completados", "Cancelados", "Pagado por adelantado"]}
            rows={data.byBarber.map((b) => ({
              key: b.barberId,
              cells: [b.name, b.branchName ?? "Varias", formatMoney(b.income), b.completed, b.cancelled, formatMoney(b.prepaid.amount)],
            }))}
          />

          <ReportTable
            title="Por servicio"
            headers={["Servicio", "Realizados", "Ingresos"]}
            rows={data.byService.map((s) => ({ key: s.cutId, cells: [s.name, s.completed, formatMoney(s.income)] }))}
          />

          <ReportTable
            title="Ganancia de productos"
            headers={["Producto", "Categoría", "Unidades", "Ventas", "Costo", "Ganancia", "Margen"]}
            rows={data.byProduct.products.map((p) => ({
              key: p.productId,
              cells: [p.name, p.category, p.units, formatMoney(p.income), formatMoney(p.cost), formatMoney(p.profit),
                p.marginPercent === null ? "—" : formatPercent(p.marginPercent)],
            }))}
          />

          <ReportTable
            title="Por categoría"
            headers={["Categoría", "Unidades", "Ventas", "Costo", "Ganancia"]}
            rows={data.byProduct.categories.map((c) => ({
              key: c.categoryId,
              cells: [c.name, c.units, formatMoney(c.income), formatMoney(c.cost), formatMoney(c.profit)],
            }))}
          />

          <p className="report-note">
            Cuentan como ingreso los turnos pagados que se completaron o se cancelaron sin reembolso, y los pedidos pagados,
            listos, entregados o cancelados sin reembolso. La ganancia usa el costo guardado al momento de cada venta.
          </p>
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AdminReportsPage;
