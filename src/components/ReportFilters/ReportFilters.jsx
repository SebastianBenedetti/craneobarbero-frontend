function ReportFilters({ value, onChange, branches, children }) {
  const update = (field) => (e) => onChange({ ...value, [field]: e.target.value });

  return (
    <div className="report-filters">
      <div className="report-filter">
        <label htmlFor="report-from" className="admin-form-label">Desde</label>
        <input id="report-from" type="date" className="form-control bg-secondary text-white border-secondary"
          value={value.from} max={value.to || undefined} onChange={update("from")} />
      </div>
      <div className="report-filter">
        <label htmlFor="report-to" className="admin-form-label">Hasta</label>
        <input id="report-to" type="date" className="form-control bg-secondary text-white border-secondary"
          value={value.to} min={value.from || undefined} onChange={update("to")} />
      </div>
      {branches && (
        <div className="report-filter">
          <label htmlFor="report-branch" className="admin-form-label">Sucursal</label>
          <select id="report-branch" className="form-select bg-secondary text-white border-secondary"
            value={value.branchId ?? ""} onChange={update("branchId")}>
            <option value="">Todas</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint }) {
  return (
    <div className="report-stat">
      <span className="report-stat-label">{label}</span>
      <span className="report-stat-value">{value}</span>
      {hint && <span className="report-stat-hint">{hint}</span>}
    </div>
  );
}

export function IncomeBars({ rows }) {
  const max = Math.max(...rows.map((r) => Number(r.totalIncome)), 0);
  if (rows.length === 0) return <p className="text-secondary">Sin datos en el período.</p>;
  return (
    <div className="report-bars" role="list">
      {rows.map((r) => (
        <div key={r.period} className="report-bar-row" role="listitem">
          <span className="report-bar-label">{r.period}</span>
          <div className="report-bar-track">
            <div className="report-bar-fill" style={{ width: max > 0 ? `${(Number(r.totalIncome) / max) * 100}%` : 0 }} />
          </div>
          <span className="report-bar-value">${Number(r.totalIncome).toLocaleString("es-AR")}</span>
        </div>
      ))}
    </div>
  );
}

export default ReportFilters;
