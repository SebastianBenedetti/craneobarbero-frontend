import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import AppointmentEditModal from "../../components/AppointmentEditModal/AppointmentEditModal";
import CancelAppointmentModal from "../../components/CancelAppointmentModal/CancelAppointmentModal";
import AppointmentStatusBadge from "../../components/AppointmentStatusBadge/AppointmentStatusBadge";
import { downloadAppointmentCalendar, getMyAppointments, payAppointment } from "../../services/appointments.services";

const MODIFY_WINDOW_HOURS = 4;

const money = (value) => `$${Number(value ?? 0).toLocaleString("es-AR")}`;

// pagina donde el cliente logueado ve y gestiona sus propios turnos
function MyAppointmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // turno que se esta por cancelar, se lo pasamos al modal de cancelacion
  const [cancelingAppointment, setCancelingAppointment] = useState(null);

  // turno seleccionado para editar, se lo pasamos al AppointmentEditModal
  const [editingAppointment, setEditingAppointment] = useState(null);

  // mensaje de feedback que aparece debajo del turno afectado (no es un toast global)
  const [actionMsg, setActionMsg] = useState({ id: null, text: "", type: "" });
  const [payingId, setPayingId] = useState(null);

  useEffect(() => {
    document.title = " Mis turnos | Cráneo Barbero";
  }, []);

  // funcion reutilizable para traer los turnos del servidor
  // la llamamos al montar y tambien despues de cada accion
  const fetchAppointments = useCallback(() => {
    getMyAppointments()
      .then((data) => {
        setAppointments(data);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // solo cargamos turnos si hay un usuario logueado
  useEffect(() => {
    if (user) fetchAppointments();
  }, [user, fetchAppointments]);

  const replace = (updated) =>
    setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

  const pay = async (appointment) => {
    setPayingId(appointment.id);
    try {
      const { checkoutUrl } = await payAppointment(appointment.id);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setActionMsg({ id: appointment.id, text: err.message, type: "danger" });
      setPayingId(null);
      fetchAppointments();
    }
  };

  // si no esta logueado mostramos un mensaje y boton para ir al login
  if (!user) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "80vh" }}
      >
        <div className="text-center">
          <p className="text-warning mb-3">
            Debés iniciar sesión para ver tus turnos.
          </p>
          <button
            className="btn btn-warning text-dark"
            onClick={() => navigate("/login")}
          >
            Ir al login
          </button>
        </div>
      </div>
    );
  }

  const now = new Date();

  // separamos los turnos activos de los que ya terminaron o fueron cancelados
  // los activos muestran botones de accion, los del historial son de solo lectura
  const isActive = (a) =>
    (a.status === "pending" || a.status === "awaiting_payment") && new Date(a.endDate) > now;
  const activeAppointments = appointments
    .filter(isActive)
    .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
  const pastAppointments = appointments.filter((a) => !isActive(a));

  return (
    <div
      style={{ maxWidth: "700px", margin: "0 auto", padding: "100px 20px 40px" }}
      className="page-transition"
    >
      <button
        className="btn btn-outline-secondary btn-sm mb-4"
        onClick={() => navigate(-1)}
      >
        ← Volver
      </button>

      <h3 className="text-warning mb-4">Mis turnos</h3>

      {loading && <p className="text-secondary">Cargando turnos...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && activeAppointments.length === 0 && (
        <div className="card bg-dark border-secondary p-4 text-center">
          <p className="text-secondary mb-3">No tenés turnos activos.</p>
          <button
            className="btn btn-warning text-dark"
            onClick={() => navigate("/appointment")}
          >
            Sacar un turno
          </button>
        </div>
      )}

      {/* listado de turnos activos, cada uno con sus acciones segun el estado */}
      {activeAppointments.map((appointment) => {
        const date = new Date(appointment.appointmentDate);
        const hoursLeft = (date - now) / 3600000;
        const started = hoursLeft <= 0;
        const canModify = appointment.status === "pending" && hoursLeft >= MODIFY_WINDOW_HOURS;
        const awaiting = appointment.status === "awaiting_payment";

        return (
          <div key={appointment.id} className="card bg-dark border-warning mb-3 p-4">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
              <div>
                <span className="text-warning fw-bold text-capitalize" style={{ fontSize: "1rem" }}>
                  {date.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span>
                <span className="text-secondary ms-2" style={{ fontSize: "0.9rem" }}>
                  {date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                </span>
              </div>
              <AppointmentStatusBadge appointment={appointment} forClient />
            </div>

            <p className="text-light mb-1" style={{ fontSize: "0.9rem" }}>
              {appointment.cut?.name} · {money(appointment.price)}
            </p>
            {appointment.barber && (
              <p className="text-light mb-1" style={{ fontSize: "0.9rem" }}>
                Barbero: <span className="text-white">{appointment.barber.name}</span>
              </p>
            )}
            {appointment.branch && (
              <p className="text-secondary mb-1" style={{ fontSize: "0.85rem" }}>
                {appointment.branch.name} — {appointment.branch.address}
              </p>
            )}

            {/* mensaje de exito o error que aparece despues de una accion */}
            {actionMsg.id === appointment.id && actionMsg.text && (
              <div className={`alert alert-${actionMsg.type} py-2 mt-2`} style={{ fontSize: "0.85rem" }}>
                {actionMsg.text}
              </div>
            )}

            {!started && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {awaiting && (
                  <button className="btn btn-warning text-dark btn-sm" onClick={() => pay(appointment)} disabled={payingId === appointment.id}>
                    {payingId === appointment.id ? "Abriendo el pago…" : "Pagar"}
                  </button>
                )}
                {appointment.status === "pending" && (
                  <button
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => setEditingAppointment(appointment)}
                    disabled={!canModify}
                    title={canModify ? undefined : `Faltan menos de ${MODIFY_WINDOW_HOURS} horas: ya no se puede modificar`}
                  >
                    Modificar
                  </button>
                )}
                <button className="btn btn-outline-danger btn-sm" onClick={() => setCancelingAppointment(appointment)}>
                  Cancelar turno
                </button>
                {appointment.status === "pending" && (
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={() =>
                      downloadAppointmentCalendar(appointment.id).catch((err) =>
                        setActionMsg({ id: appointment.id, text: err.message, type: "danger" }),
                      )
                    }
                  >
                    Agregar al calendario
                  </button>
                )}
              </div>
            )}
            {appointment.status === "pending" && !started && !canModify && (
              <p className="text-secondary small mt-2 mb-0">
                Faltan menos de {MODIFY_WINDOW_HOURS} horas: el turno ya no se puede modificar. Si no podés venir, podés cancelarlo.
              </p>
            )}
          </div>
        );
      })}

      {/* historial de turnos completados y cancelados (incluyendo los que cancelo el barbero) */}
      {pastAppointments.length > 0 && (
        <>
          <h5 className="text-secondary mt-4 mb-3">Historial</h5>
          {pastAppointments.map((appointment) => {
            const date = new Date(appointment.appointmentDate);
            return (
              <div key={appointment.id} className="card bg-dark border-secondary mb-2 p-3">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <span className="text-light" style={{ fontSize: "0.9rem" }}>
                    {date.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}{" "}
                    {date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    {" · "}{appointment.cut?.name}
                    {appointment.barber && ` · ${appointment.barber.name}`}
                  </span>
                  <AppointmentStatusBadge appointment={appointment} forClient />
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* modal para cambiar la fecha y hora */}
      {editingAppointment && (
        <AppointmentEditModal
          appointment={editingAppointment}
          onClose={() => setEditingAppointment(null)}
          onSaved={(updated) => {
            replace(updated);
            setActionMsg({ id: updated.id, text: "Turno modificado. Te enviamos un mail con los datos nuevos.", type: "success" });
            setEditingAppointment(null);
          }}
        />
      )}

      {/* modal de cancelacion con el aviso de reembolso */}
      {cancelingAppointment && (
        <CancelAppointmentModal
          appointment={cancelingAppointment}
          onClose={() => setCancelingAppointment(null)}
          onCancelled={(updated) => {
            replace(updated);
            setCancelingAppointment(null);
          }}
        />
      )}
    </div>
  );
}

export default MyAppointmentsPage;
