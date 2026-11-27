import { useState } from "react";

function upcomingFirst(a, b) {
  const now = Date.now();
  const timeA = new Date(a.endDate ?? a.appointmentDate).getTime();
  const timeB = new Date(b.endDate ?? b.appointmentDate).getTime();
  const pastA = timeA < now;
  const pastB = timeB < now;
  if (pastA !== pastB) return pastA ? 1 : -1;
  const startA = new Date(a.appointmentDate).getTime();
  const startB = new Date(b.appointmentDate).getTime();
  return pastA ? startB - startA : startA - startB;
}

// hook para manejar filtros y paginado de turnos
// lo usamos en la agenda del barber y en el panel admin
// recibe el array de turnos y devuelve todo lo necesario para filtrar y paginar
function useAppointmentFilters(appointments) {
  // filtro activo por estado, puede ser "all", "awaiting_payment", "pending", "completed", "cancelled" o "expired"
  const [activeFilter, setActiveFilter] = useState("all");

  // rango de fechas, si están vacíos no se aplica el filtro de fechas
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // filtros extra para el admin, por barbero y sucursal
  // son strings vacíos por defecto así no afectan la agenda del barber
  const [filterBarberId, setFilterBarberId] = useState("");
  const [filterBranchId, setFilterBranchId] = useState("");

  // cuántos resultados mostrar por página
  const [pageSize, setPageSize] = useState(10);

  // página actual
  const [currentPage, setCurrentPage] = useState(1);

  // cada vez que cambia algo del filtro, volvemos a la primera página
  // para no quedar en una página que ya no existe
  const filterKey = [activeFilter, dateFrom, dateTo, pageSize, filterBarberId, filterBranchId].join("|");
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (lastFilterKey !== filterKey) {
    setLastFilterKey(filterKey);
    setCurrentPage(1);
  }

  // filtramos por estado
  const filteredByStatus = appointments.filter((a) => {
    if (activeFilter === "all") return true; // "all" muestra todo
    return a.status === activeFilter;
  });

  // después filtramos por rango de fechas, barbero y sucursal, y ordenamos
  const filtered = filteredByStatus
    .filter((a) => {
      const date = new Date(a.appointmentDate);
      if (dateFrom) {
        // parseamos como fecha local para no tener problemas de timezone
        const [fy, fm, fd] = dateFrom.split("-").map(Number);
        const start = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
        if (date < start) return false;
      }
      if (dateTo) {
        // parseamos como fecha local e incluimos todo el día "hasta"
        const [ty, tm, td] = dateTo.split("-").map(Number);
        const end = new Date(ty, tm - 1, td, 23, 59, 59, 999);
        if (date > end) return false;
      }
      // si hay un barbero seleccionado, filtramos por él
      if (filterBarberId && String(a.barber?.id) !== String(filterBarberId)) return false;
      // si hay una sucursal seleccionada, la comparamos con la sucursal del turno
      if (filterBranchId && String(a.branch?.id) !== String(filterBranchId)) return false;
      return true;
    })
    .sort(upcomingFirst);

  // cuántas páginas hay en total
  const totalPages = Math.ceil(filtered.length / pageSize);

  // recortamos el array para la página actual
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  // devolvemos todo lo que necesita el componente que use este hook
  return {
    activeFilter,
    setActiveFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    filterBarberId,
    setFilterBarberId,
    filterBranchId,
    setFilterBranchId,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    filtered,
    paginated,
    totalPages,
  };
}

export default useAppointmentFilters;