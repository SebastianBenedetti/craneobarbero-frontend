import { useEffect, useState } from "react";
import PaginationControls from "../PaginationControls/PaginationControls";
import ReviewList from "./ReviewList";
import StarDisplay from "../StarRating/StarDisplay";
import useBranches from "../../hooks/useBranches";
import useBarbers from "../../hooks/useBarbers";
import { getReviews } from "../../services/reviews.services";
import "../../styles/reviews.css";

const formatAverage = (value) => (value === null || value === undefined ? "—" : Number(value).toLocaleString("es-AR", { maximumFractionDigits: 2 }));

const SELECT_CLASS = "form-select bg-secondary text-white border-secondary";

function AdminFilters({ filters, onChange }) {
  const branches = useBranches();
  const barbers = useBarbers();
  return (
    <div className="d-flex flex-wrap gap-2 mb-3">
      <select className={SELECT_CLASS} style={{ maxWidth: 260 }} value={filters.branchId} onChange={(e) => onChange("branchId", e.target.value)} aria-label="Sucursal">
        <option value="">Todas las sucursales</option>
        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
      <select className={SELECT_CLASS} style={{ maxWidth: 260 }} value={filters.barberId} onChange={(e) => onChange("barberId", e.target.value)} aria-label="Barbero">
        <option value="">Todos los barberos</option>
        {barbers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select>
    </div>
  );
}

function ReviewsPanel({ isAdmin = false }) {
  const [filters, setFilters] = useState({ branchId: "", barberId: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getReviews({ ...(isAdmin ? filters : {}), page, pageSize })
      .then((response) => { if (!cancelled) { setData(response); setError(""); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [isAdmin, filters, page, pageSize]);

  const changeFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div>
      {isAdmin && <AdminFilters filters={filters} onChange={changeFilter} />}
      {error && <p className="text-danger" role="alert">{error}</p>}
      {!data && !error && <p className="text-secondary">Cargando…</p>}

      {data && (
        <>
          <div className="review-summary">
            <div className="review-summary-card">
              <span className="review-summary-value">{formatAverage(data.averageBarber)}</span>
              {data.averageBarber !== null && <StarDisplay value={data.averageBarber} />}
              <div className="review-summary-label">{isAdmin ? "Promedio de los barberos" : "Tu promedio como barbero"}</div>
            </div>
            <div className="review-summary-card">
              <span className="review-summary-value">{formatAverage(data.averageCut)}</span>
              {data.averageCut !== null && <StarDisplay value={data.averageCut} />}
              <div className="review-summary-label">Promedio de los servicios</div>
            </div>
            <div className="review-summary-card">
              <span className="review-summary-value">{data.total}</span>
              <div className="review-summary-label">{data.total === 1 ? "Reseña" : "Reseñas"}</div>
            </div>
          </div>

          {isAdmin && data.byBarber?.length > 0 && (
            <div className="admin-breakdown-card mb-4">
              <h3 className="admin-breakdown-title">Por barbero</h3>
              <div className="table-responsive">
                <table className="admin-breakdown-table">
                  <thead>
                    <tr><th>Barbero</th><th>Reseñas</th><th>Barbero</th><th>Servicio</th></tr>
                  </thead>
                  <tbody>
                    {data.byBarber.map((row) => (
                      <tr key={row.barberId}>
                        <td>{row.name}</td>
                        <td>{row.count}</td>
                        <td><span className="text-warning">{formatAverage(row.averageBarber)}</span> <StarDisplay value={row.averageBarber} size="0.8rem" /></td>
                        <td><span className="text-warning">{formatAverage(row.averageCut)}</span> <StarDisplay value={row.averageCut} size="0.8rem" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <ReviewList reviews={data.items} showBarber={isAdmin} />
          <div className="mt-3">
            <PaginationControls
              currentPage={page}
              totalPages={Math.ceil(data.total / pageSize)}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              total={data.total}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default ReviewsPanel;
