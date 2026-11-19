import { useEffect, useState } from "react";
import { getAvailabilityDays } from "../../services/schedule.services";
import { MONTHS, WEEKDAY_SHORT, addDays, monthGrid, monthRange, todayKey } from "../../utils/dates";
import "../../styles/calendar.css";

const BOOKING_WINDOW_DAYS = 60;

const STATUS_TEXT = {
  available: "con horarios",
  full: "sin horarios libres",
  closed: "cerrado",
  holiday: "feriado",
};

function Calendar({ selectedBarber, selectedCut, onSelectDay }) {
  const today = todayKey();
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);
  const [result, setResult] = useState({ key: null, days: {}, lastBookable: null, error: "" });

  const requestKey = `${selectedBarber}|${selectedCut}|${view.year}-${view.month}`;
  const loading = result.key !== requestKey;
  const lastBookable = result.lastBookable ?? addDays(today, BOOKING_WINDOW_DAYS);

  useEffect(() => {
    let cancelled = false;
    const { from, to } = monthRange(view.year, view.month);
    const start = from < today ? today : from;
    if (to < start) return undefined;
    getAvailabilityDays(selectedBarber, selectedCut, start, to)
      .then((data) => {
        if (cancelled) return;
        setResult({
          key: requestKey,
          days: Object.fromEntries(data.days.map((d) => [d.date, d])),
          lastBookable: data.lastBookableDate,
          error: "",
        });
      })
      .catch((err) => !cancelled && setResult({ key: requestKey, days: {}, lastBookable: null, error: err.message }));
    return () => { cancelled = true; };
  }, [requestKey, selectedBarber, selectedCut, view.year, view.month, today]);

  const move = (delta) => setView(({ year, month }) => {
    const date = new Date(year, month + delta, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
  });

  const canGoPrev = view.year > now.getFullYear() || (view.year === now.getFullYear() && view.month > now.getMonth());
  const nextMonthStart = monthRange(view.year, view.month + 1).from;
  const canGoNext = nextMonthStart <= lastBookable;

  const handleDay = (key) => {
    setSelectedDay(key);
    onSelectDay(key);
  };

  return (
    <div className="mt-4 booking-calendar">
      <h5 className="text-white p-2 rounded mb-3 d-inline-block">Elegí un día:</h5>
      <div className="d-flex align-items-center gap-3 mb-3">
        <button className="btn btn-outline-warning m-1 text-white booking-calendar-nav" onClick={() => move(-1)}
          disabled={!canGoPrev} aria-label="Mes anterior">
          {"<"}
        </button>
        <span className="text-white">
          {MONTHS[view.month]} {view.year}
        </span>
        <button className="btn btn-outline-warning m-1 text-white booking-calendar-nav" onClick={() => move(1)}
          disabled={!canGoNext} aria-label="Mes siguiente">
          {">"}
        </button>
        {loading && <span className="text-secondary small">Cargando…</span>}
      </div>

      {result.error && result.key === requestKey && (
        <div className="alert alert-danger py-2" role="alert">{result.error}</div>
      )}

      <div className="booking-calendar-grid" role="grid">
        {WEEKDAY_SHORT.map((day) => (
          <div className="text-warning text-center fw-bold" key={day} role="columnheader">
            {day}
          </div>
        ))}

        {monthGrid(view.year, view.month).map((cell) => {
          if (!cell.inMonth) return <div key={cell.key} aria-hidden="true" />;
          const info = loading ? null : result.days[cell.key];
          const outOfWindow = cell.key < today || cell.key > lastBookable;
          const status = outOfWindow ? "out" : info?.status ?? (loading ? "loading" : "closed");
          const enabled = status === "available";
          const selected = selectedDay === cell.key;
          const label = `${cell.day}: ${outOfWindow ? "no disponible" : info?.holidayName ? `feriado (${info.holidayName})` : STATUS_TEXT[status] ?? ""}`;

          return (
            <button
              key={cell.key}
              role="gridcell"
              className={`booking-day booking-day-${status} ${selected ? "booking-day-selected" : ""}`}
              disabled={!enabled}
              aria-pressed={selected}
              aria-label={label}
              title={info?.holidayName ?? undefined}
              onClick={() => handleDay(cell.key)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      <div className="booking-legend">
        <span><i className="booking-swatch booking-swatch-available" /> Con horarios</span>
        <span><i className="booking-swatch booking-swatch-full" /> Sin lugar</span>
        <span><i className="booking-swatch booking-swatch-holiday" /> Feriado</span>
        <span><i className="booking-swatch booking-swatch-closed" /> Cerrado / fuera de los 60 días</span>
      </div>
    </div>
  );
}

export default Calendar;
