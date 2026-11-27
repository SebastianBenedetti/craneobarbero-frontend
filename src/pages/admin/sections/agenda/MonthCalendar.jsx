import { MONTHS, WEEKDAY_SHORT, monthGrid, todayKey } from "../../../../utils/dates";
import { plural } from "../../../../utils/format";

function dayState(info, holiday) {
  if (holiday?.isActive) return "holiday";
  if (!info) return "empty";
  if (info.free + info.busy === 0) return info.deleted > 0 ? "removed" : "closed";
  return "open";
}

function MonthCalendar({ year, month, days, holidays, selected, loading, onSelect, onPrev, onNext, canGoPrev }) {
  const today = todayKey();
  const cells = monthGrid(year, month);

  return (
    <div className="agenda-calendar">
      <div className="agenda-calendar-nav">
        <button type="button" className="agenda-nav-btn" onClick={onPrev} disabled={!canGoPrev} aria-label="Mes anterior">
          ‹
        </button>
        <span className="agenda-calendar-title">
          {MONTHS[month]} {year}
          {loading && <span className="agenda-muted"> · cargando…</span>}
        </span>
        <button type="button" className="agenda-nav-btn" onClick={onNext} aria-label="Mes siguiente">
          ›
        </button>
      </div>

      <div className="agenda-grid" role="grid">
        {WEEKDAY_SHORT.map((d) => (
          <div key={d} className="agenda-grid-head" role="columnheader">
            {d}
          </div>
        ))}
        {cells.map((cell) => {
          const info = cell.inMonth ? days[cell.key] : null;
          const holiday = holidays[cell.key];
          const state = cell.inMonth ? dayState(info, holiday) : "outside";
          const past = cell.key < today;
          const classes = [
            "agenda-day",
            `agenda-day-${state}`,
            past ? "agenda-day-past" : "",
            cell.key === today ? "agenda-day-today" : "",
            cell.key === selected ? "agenda-day-selected" : "",
          ].join(" ");

          if (!cell.inMonth) {
            return <div key={cell.key} className={classes} aria-hidden="true" />;
          }

          const holidayName = holiday?.isActive ? holiday.name : null;
          const label = [
            cell.key,
            holidayName ? `feriado: ${holidayName}` : "",
            info ? `${plural(info.free, "libre", "libres")}, ${plural(info.busy, "ocupado", "ocupados")}, ${plural(info.deleted, "eliminado", "eliminados")}` : "",
          ].filter(Boolean).join(", ");

          return (
            <button
              key={cell.key}
              type="button"
              role="gridcell"
              className={classes}
              aria-label={label}
              aria-pressed={cell.key === selected}
              onClick={() => onSelect(cell.key)}
            >
              <span className="agenda-day-number">{cell.day}</span>
              {holidayName && <span className="agenda-day-holiday" title={holidayName}>{holidayName}</span>}
              {info && (info.free > 0 || info.busy > 0 || info.deleted > 0) && (
                <span className="agenda-day-counts">
                  {info.free > 0 && <span className="agenda-count agenda-count-free">{info.free} libres</span>}
                  {info.busy > 0 && <span className="agenda-count agenda-count-busy">{info.busy} ocup.</span>}
                  {info.deleted > 0 && <span className="agenda-count agenda-count-deleted">{info.deleted} elim.</span>}
                </span>
              )}
              {info?.extra > 0 && <span className="agenda-day-extra" title="Tiene horarios agregados a mano">+ extra</span>}
            </button>
          );
        })}
      </div>

      <div className="agenda-legend" aria-label="Referencias">
        <span><i className="agenda-dot agenda-dot-free" /> Libres</span>
        <span><i className="agenda-dot agenda-dot-busy" /> Ocupados</span>
        <span><i className="agenda-dot agenda-dot-deleted" /> Eliminados</span>
        <span><i className="agenda-dot agenda-dot-holiday" /> Feriado / no laborable</span>
        <span><i className="agenda-dot agenda-dot-closed" /> Cerrado</span>
        <span><i className="agenda-dot agenda-dot-extra" /> Horarios extra</span>
      </div>
    </div>
  );
}

export default MonthCalendar;
