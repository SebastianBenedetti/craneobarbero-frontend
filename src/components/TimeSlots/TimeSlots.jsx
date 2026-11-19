import { useState, useEffect } from "react";
import { getAvailabilityTimes } from "../../services/schedule.services";
import "../../styles/calendar.css";

function TimeSlots({ selectedBarber, selectedCut, selectedDay, onSelectHour }) {
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState({ key: null, times: [], error: "" });
  const requestKey = `${selectedBarber}|${selectedCut}|${selectedDay}`;
  const loading = result.key !== requestKey;

  useEffect(() => {
    let cancelled = false;
    getAvailabilityTimes(selectedBarber, selectedCut, selectedDay)
      .then((data) => !cancelled && setResult({ key: requestKey, times: data.times ?? [], error: "" }))
      .catch((err) => !cancelled && setResult({ key: requestKey, times: [], error: err.message }));
    return () => { cancelled = true; };
  }, [requestKey, selectedBarber, selectedCut, selectedDay]);

  return (
    <div className="mt-4">
      <h5 className="btn-dark text-white w-100 p-1 mb-3">Elegí un horario</h5>
      {loading && <p className="text-secondary">Cargando horarios…</p>}
      {!loading && result.error && <div className="alert alert-danger py-2">{result.error}</div>}
      {!loading && !result.error && result.times.length === 0 && (
        <p className="text-secondary">No quedan horarios libres ese día. Probá con otro.</p>
      )}
      <div className="booking-times">
        {!loading && result.times.map((slot) => {
          const isSelected = selected === slot.startAt;
          return (
            <button
              className={`btn w-100 p-2 ${isSelected ? "btn-warning text-dark fw-bold" : "btn-dark text-white"}`}
              key={slot.startAt}
              aria-pressed={isSelected}
              onClick={() => {
                setSelected(slot.startAt);
                onSelectHour(slot);
              }}
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TimeSlots;
