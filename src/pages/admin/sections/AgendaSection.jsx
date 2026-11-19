import { useCallback, useEffect, useMemo, useState } from "react";
import Toast from "../../../components/Toast/Toast";
import { getAllBarbersAdminService, getAllBranchesAdminService } from "../../../services/admin.services";
import { getHolidays, getScheduleOverview } from "../../../services/schedule.services";
import { monthRange, todayKey } from "../../../utils/dates";
import ScopeSelector from "./agenda/ScopeSelector";
import MonthCalendar from "./agenda/MonthCalendar";
import DayPanel from "./agenda/DayPanel";
import SlotOperationForm from "./agenda/SlotOperationForm";
import "../../../styles/appointmentModal.css";
import "../../../styles/agenda.css";

const MODES = [
  { id: "add", icon: "✦", label: "Agregar horarios", desc: "Uno, una franja o un rango de días, incluso fuera de horario" },
  { id: "remove", icon: "✕", label: "Eliminar horarios", desc: "Un día, una franja o un rango, con análisis de turnos afectados", danger: true },
];

function AgendaSection() {
  const now = new Date();
  const [branches, setBranches] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [branchIds, setBranchIds] = useState([]);
  const [barberIds, setBarberIds] = useState([]);
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [overview, setOverview] = useState({ key: null, days: {} });
  const [holidays, setHolidays] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [operation, setOperation] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getAllBranchesAdminService(
      (data) => {
        const active = data.filter((b) => b.isActive);
        setBranches(active);
        setBranchIds(active.map((b) => b.id));
      },
      (err) => setToast({ message: err.message, type: "danger" }),
    );
    getAllBarbersAdminService(
      (data) => setBarbers(data.filter((b) => b.isActive && b.branchIsActive !== false)),
      (err) => setToast({ message: err.message, type: "danger" }),
    );
  }, []);

  const allBranches = branches.length > 0 && branchIds.length === branches.length;
  const scope = useMemo(() => ({
    allBranches: allBranches || undefined,
    branchIds: allBranches ? undefined : branchIds,
    barberIds: barberIds.length > 0 ? barberIds : undefined,
  }), [allBranches, branchIds, barberIds]);

  const overviewKey = `${view.year}-${view.month}|${branchIds.join(",")}|${barberIds.join(",")}|${refreshKey}`;
  const loadingOverview = branchIds.length > 0 && overview.key !== overviewKey;

  useEffect(() => {
    if (branchIds.length === 0) return;
    let cancelled = false;
    const { from, to } = monthRange(view.year, view.month);
    getScheduleOverview(from, to, branchIds, barberIds)
      .then((days) => !cancelled && setOverview({ key: overviewKey, days: Object.fromEntries(days.map((d) => [d.date, d])) }))
      .catch((err) => !cancelled && setToast({ message: err.message, type: "danger" }));
    return () => { cancelled = true; };
  }, [overviewKey, view.year, view.month, branchIds, barberIds]);

  useEffect(() => {
    let cancelled = false;
    getHolidays(view.year)
      .then((list) => !cancelled && setHolidays(Object.fromEntries(list.map((h) => [h.date, h]))))
      .catch((err) => !cancelled && setToast({ message: err.message, type: "danger" }));
    return () => { cancelled = true; };
  }, [view.year, refreshKey]);

  const barbersInScope = useMemo(() => barbers.filter((b) =>
    branchIds.includes(b.branchId) && (barberIds.length === 0 || barberIds.includes(b.id))), [barbers, branchIds, barberIds]);
  const branchesById = Object.fromEntries(branches.map((b) => [b.id, b]));

  const scopeLabel = (barber) => {
    if (barber) return `${barber.name} (${branchesById[barber.branchId]?.name ?? "sucursal"})`;
    const branchText = allBranches ? "todas las sucursales" : branches.filter((b) => branchIds.includes(b.id)).map((b) => b.name).join(", ");
    if (barberIds.length === 0) return `todos los barberos de ${branchText || "ninguna sucursal"}`;
    return `${barbersInScope.map((b) => b.name).join(", ")} (${branchText})`;
  };

  const openOperation = (mode, initial, barber) => {
    setOperation((prev) => ({ mode, initial, barber, id: (prev?.id ?? 0) + 1 }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const handleDone = (message) => {
    setOperation(null);
    setToast({ message, type: "success" });
    refresh();
  };

  const moveMonth = (delta) => setView(({ year, month }) => {
    const date = new Date(year, month + delta, 1);
    return { year: date.getFullYear(), month: date.getMonth() };
  });

  const canGoPrev = view.year > now.getFullYear() || (view.year === now.getFullYear() && view.month > now.getMonth());

  return (
    <div className="agenda">
      <ScopeSelector
        branches={branches}
        barbers={barbers}
        branchIds={branchIds}
        barberIds={barberIds}
        onBranchesChange={setBranchIds}
        onBarbersChange={setBarberIds}
      />

      {operation ? (
        <SlotOperationForm
          key={operation.id}
          mode={operation.mode}
          initial={operation.initial}
          scope={operation.barber
            ? { branchIds: [operation.barber.branchId], barberIds: [operation.barber.id] }
            : scope}
          scopeLabel={scopeLabel(operation.barber)}
          onDone={handleDone}
          onCancel={() => setOperation(null)}
        />
      ) : (
        <div className="agenda-modes">
          {MODES.map((m) => (
            <button key={m.id} type="button" className={`agenda-mode ${m.danger ? "agenda-mode-danger" : ""}`}
              onClick={() => openOperation(m.id, { dateFrom: selectedDate && selectedDate >= todayKey() ? selectedDate : todayKey() })}>
              <span className="agenda-mode-icon" aria-hidden="true">{m.icon}</span>
              <span className="agenda-mode-label">{m.label}</span>
              <span className="agenda-mode-desc">{m.desc}</span>
            </button>
          ))}
        </div>
      )}

      <div className={`agenda-body ${selectedDate ? "agenda-body-with-panel" : ""}`}>
        <MonthCalendar
          year={view.year}
          month={view.month}
          days={branchIds.length > 0 ? overview.days : {}}
          holidays={holidays}
          selected={selectedDate}
          loading={loadingOverview}
          onSelect={(key) => setSelectedDate((current) => (current === key ? null : key))}
          onPrev={() => moveMonth(-1)}
          onNext={() => moveMonth(1)}
          canGoPrev={canGoPrev}
        />
        {selectedDate && (
          <DayPanel
            date={selectedDate}
            barbers={barbersInScope}
            branchesById={branchesById}
            holiday={holidays[selectedDate]}
            refreshKey={refreshKey}
            onOperate={openOperation}
            onHolidayChanged={(message) => { setToast({ message, type: "success" }); refresh(); }}
            onError={(message) => setToast({ message, type: "danger" })}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default AgendaSection;
