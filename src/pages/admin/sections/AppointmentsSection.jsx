import { useState, useEffect, useCallback } from "react";
import { getAllBarbersAdminService, getAllBranchesAdminService } from "../../../services/admin.services";
import { getStaffAppointments } from "../../../services/appointments.services";
import useAppointmentFilters from "../../../hooks/useAppointmentFilters";
import AppointmentEditModal from "../../../components/AppointmentEditModal/AppointmentEditModal";
import AppointmentModal from "../../../components/AppointmentModal/AppointmentModal";
import CancelAppointmentModal from "../../../components/CancelAppointmentModal/CancelAppointmentModal";
import NewAppointmentModal from "../../../components/NewAppointmentModal/NewAppointmentModal";
import AppointmentStatusBadge from "../../../components/AppointmentStatusBadge/AppointmentStatusBadge";
import PaginationControls from "../../../components/PaginationControls/PaginationControls";
import Toast from "../../../components/Toast/Toast";
import "../../../styles/appointmentModal.css";

const STATUS_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "pending", label: "Confirmados" },
  { key: "awaiting_payment", label: "Esperando pago" },
  { key: "completed", label: "Completados" },
  { key: "cancelled", label: "Cancelados" },
  { key: "expired", label: "Expirados" },
];

function AppointmentsSection() {
  const [appointments, setAppointments] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // modales de detalle, editar, cancelar y crear
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [cancelingAppointment, setCancelingAppointment] = useState(null);
  const [creating, setCreating] = useState(false);

  // buscador de cliente por nombre para filtrar la lista
  const [clientSearch, setClientSearch] = useState("");

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const clientOf = (a) => a.client?.name || a.clientName || "—";

  // primero filtramos por nombre de cliente y despues paginamos
  const searched = clientSearch.trim()
    ? appointments.filter((a) => clientOf(a).toLowerCase().includes(clientSearch.trim().toLowerCase()))
    : appointments;

  // usamos el hook de filtros que ya tiene soporte para barbero y sucursal
  const {
    activeFilter, setActiveFilter,
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    filterBarberId, setFilterBarberId,
    filterBranchId, setFilterBranchId,
    pageSize, setPageSize,
    currentPage, setCurrentPage,
    filtered, paginated, totalPages,
  } = useAppointmentFilters(searched);

  const loadAppointments = useCallback(() => {
    return getStaffAppointments()
      .then((data) => { setAppointments(data); setError(""); })
      .catch((err) => setError(err.message));
  }, []);

  // cargamos los datos al montar la sección
  useEffect(() => {
    getAllBarbersAdminService((data) => setBarbers(data), () => setBarbers([]));
    getAllBranchesAdminService((data) => setBranches(data), () => setBranches([]));
    loadAppointments().finally(() => setLoading(false));
  }, [loadAppointments]);

  const replace = (updated) =>
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

  // limpiar el rango de fechas y los filtros de barbero/sucursal
  const handleClearFilters = () => {
    setActiveFilter("all");
    setDateFrom("");
    setDateTo("");
    setFilterBarberId("");
    setFilterBranchId("");
    setClientSearch("");
  };

  // función para formatear la fecha del turno en formato 24h
  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const displayList = paginated;

  const expiredCount = appointments.filter((a) => a.status === "expired").length;
  const now = new Date();
  const activeBarbers = barbers.filter((b) => b.isActive && b.branchIsActive !== false);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Turnos</h2>
        <button className="btn btn-warning text-dark" onClick={() => setCreating(true)}>
          + Nuevo turno
        </button>
      </div>

      {/* barra de filtros */}
      <div className="admin-filters">
        <div className="admin-filter-row">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`admin-filter-btn ${activeFilter === f.key ? "admin-filter-btn-active" : ""}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* filtros por fecha, barbero y sucursal */}
        <div className="admin-filter-row admin-filter-row-selects">
          <div className="admin-filter-dates">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="form-control form-control-sm bg-secondary text-white border-secondary"
              aria-label="Desde"
            />
            <span className="text-secondary">al</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="form-control form-control-sm bg-secondary text-white border-secondary"
              aria-label="Hasta"
            />
          </div>

          <select
            value={filterBranchId}
            onChange={(e) => setFilterBranchId(e.target.value)}
            className="form-select form-select-sm bg-secondary text-white border-secondary admin-filter-select"
            aria-label="Sucursal"
          >
            <option value="">Todas las sucursales</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={filterBarberId}
            onChange={(e) => setFilterBarberId(e.target.value)}
            className="form-select form-select-sm bg-secondary text-white border-secondary admin-filter-select"
            aria-label="Barbero"
          >
            <option value="">Todos los barberos</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <button className="btn btn-sm btn-outline-secondary" onClick={handleClearFilters}>
            Limpiar filtros
          </button>
        </div>

        {/* buscador por nombre de cliente */}
        <div className="admin-filter-row mt-2">
          <input
            type="text"
            placeholder="Buscar por nombre de cliente..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="form-control form-control-sm bg-secondary text-white border-secondary"
            style={{ maxWidth: "320px" }}
            aria-label="Buscar por nombre de cliente"
          />
        </div>
      </div>

      {activeFilter === "expired" && expiredCount > 0 && (
        <p className="text-warning small">
          Los turnos expirados son reservas online que no se pagaron dentro de los 30 minutos: el horario se liberó y no cuentan como ingreso.
        </p>
      )}

      {loading && <p className="text-secondary">Cargando...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && (
        <>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Cliente</th>
                  <th>Barbero</th>
                  <th>Servicio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-secondary text-center">
                      No hay turnos con esos filtros
                    </td>
                  </tr>
                ) : (
                  displayList.map((appointment) => {
                    const future = new Date(appointment.appointmentDate) > now;
                    const cancellable = future && ["pending", "awaiting_payment"].includes(appointment.status);
                    return (
                      <tr key={appointment.id}>
                        <td>{formatDate(appointment.appointmentDate)}</td>
                        <td>
                          <button className="btn btn-link btn-sm p-0 text-white text-start" onClick={() => setSelectedAppointment(appointment)}>
                            {clientOf(appointment)}
                          </button>
                        </td>
                        <td>{appointment.barber?.name || "—"}</td>
                        <td>{appointment.cut?.name || "—"}</td>
                        <td><AppointmentStatusBadge appointment={appointment} /></td>
                        <td>
                          <div className="admin-row-actions">
                            {future && appointment.status === "pending" && (
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => setEditingAppointment(appointment)}
                              >
                                Modificar
                              </button>
                            )}
                            {cancellable && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => setCancelingAppointment(appointment)}
                              >
                                Cancelar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="text-secondary" style={{ fontSize: "13px", marginTop: "8px" }}>
            Mostrando {filtered.length} turno{filtered.length !== 1 ? "s" : ""}
          </p>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            total={filtered.length}
          />
        </>
      )}

      <AppointmentModal appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} />

      {editingAppointment && (
        <AppointmentEditModal
          appointment={editingAppointment}
          staff
          onClose={() => setEditingAppointment(null)}
          onSaved={(updated) => {
            replace(updated);
            setEditingAppointment(null);
            showToast("Turno modificado. Si tiene cliente registrado, se le avisó por mail.");
          }}
        />
      )}

      {cancelingAppointment && (
        <CancelAppointmentModal
          appointment={cancelingAppointment}
          askReason
          onClose={() => setCancelingAppointment(null)}
          onCancelled={(updated) => {
            replace(updated);
            setCancelingAppointment(null);
            showToast("Turno cancelado.");
          }}
        />
      )}

      {creating && (
        <NewAppointmentModal
          barbers={activeBarbers}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            loadAppointments();
            showToast("Turno creado correctamente");
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default AppointmentsSection;
