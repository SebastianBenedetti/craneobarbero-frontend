import { useState } from "react";

const COLLAPSE_AFTER = 6;

function ChipGroup({ label, items, selected, onChange, emptyHint, optional }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const collapsed = items.length > COLLAPSE_AFTER;
  const allSelected = items.length > 0 && items.every((item) => selected.includes(item.id));

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const visible = collapsed && query
    ? items.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  const chips = (
    <div className="agenda-chips" role="group" aria-label={label}>
      {visible.map((item) => {
        const active = selected.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            className={`agenda-chip ${active ? "agenda-chip-active" : ""}`}
            aria-pressed={active}
            onClick={() => toggle(item.id)}
          >
            {item.name}
          </button>
        );
      })}
      {visible.length === 0 && <span className="agenda-muted">{emptyHint}</span>}
    </div>
  );

  return (
    <div className="agenda-scope-group">
      <div className="agenda-scope-header">
        <span className="agenda-scope-label">
          {label}
          {optional && <span className="agenda-muted"> (opcional)</span>}
        </span>
        <span className="agenda-scope-count">
          {selected.length === 0 && optional ? "Todos" : `${selected.length} de ${items.length}`}
        </span>
        <button
          type="button"
          className="agenda-link-btn"
          onClick={() => onChange(allSelected ? [] : items.map((item) => item.id))}
          disabled={items.length === 0}
        >
          {allSelected ? "Limpiar" : optional ? "Seleccionar todos" : "Seleccionar todas"}
        </button>
        {collapsed && (
          <button
            type="button"
            className="agenda-link-btn"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Ocultar" : "Elegir"}
          </button>
        )}
      </div>
      {collapsed ? (
        open && (
          <div className="agenda-scope-dropdown">
            <input
              className="agenda-input"
              placeholder="Buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={`Buscar en ${label.toLowerCase()}`}
            />
            {chips}
          </div>
        )
      ) : (
        chips
      )}
    </div>
  );
}

function ScopeSelector({ branches, barbers, branchIds, barberIds, onBranchesChange, onBarbersChange }) {
  const barbersInScope = barbers.filter((b) => branchIds.includes(b.branchId));

  const handleBranches = (ids) => {
    onBranchesChange(ids);
    onBarbersChange(barberIds.filter((id) => barbers.some((b) => b.id === id && ids.includes(b.branchId))));
  };

  return (
    <div className="agenda-scope">
      <ChipGroup
        label="Sucursales"
        items={branches}
        selected={branchIds}
        onChange={handleBranches}
        emptyHint="No hay sucursales activas."
      />
      <ChipGroup
        label="Barberos"
        items={barbersInScope}
        selected={barberIds}
        onChange={onBarbersChange}
        emptyHint="Elegí al menos una sucursal."
        optional
      />
    </div>
  );
}

export default ScopeSelector;
