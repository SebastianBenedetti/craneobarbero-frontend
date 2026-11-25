import { useState } from "react";
import { useNavigate } from "react-router";
import Login from "../auth/Login";
import Register from "../auth/Register";
import { useAuth } from "../../context/AuthContext";
import { bookAppointment, resendVerificationEmail } from "../../services/appointments.services";
import { fromDateKey } from "../../utils/dates";
import { backdropClose } from "../../utils/backdrop";

function AppointmentForm({ branch, barber, day, hours, cut, branches, barbers, cuts }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState("login");
  const [result, setResult] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [resendState, setResendState] = useState("");

  const selectedBranch = branches.find((b) => b.id === branch);
  const selectedBarber = barbers.find((barb) => barb.id === barber);
  const selectedCut = cuts.find((c) => c.id === cut);

  const book = async (role) => {
    if (role && role !== "client") {
      setConfirmError({ message: "Los turnos online los reserva un cliente. Desde tu panel podés cargar turnos manuales." });
      return;
    }
    setConfirmError(null);
    setConfirmLoading(true);
    try {
      const data = await bookAppointment(barber, cut, hours.startAt);
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      setResult(data.appointment);
    } catch (err) {
      setConfirmError({ message: err.message, code: err.code });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!user) { openModal(); return; }
    book(user.role);
  };

  const openModal = () => {
    setView("login");
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  // Login usa onCancel("register") para pedir cambio de vista
  const handleLoginCancel = (action) => {
    if (action === "register") {
      setView("register");
    } else {
      closeModal();
    }
  };

  const handleAuthenticated = (token) => {
    login(token);
    closeModal();
    const payload = JSON.parse(decodeURIComponent(escape(atob(token.split(".")[1]))));
    book(payload.role);
  };

  const resend = async () => {
    setResendState("sending");
    try {
      await resendVerificationEmail();
      setResendState("sent");
    } catch (err) {
      setResendState(err.message);
    }
  };

  return (
    <>
      <div className="card bg-dark border-warning mt-4 p-4">
        <h5 className="text-warning mb-3">Turno elegido:</h5>
        <div className="text-light mb-1">Sucursal: {selectedBranch?.name}</div>
        <div className="text-light mb-1">Dirección: {selectedBranch?.address}</div>
        <div className="text-light mb-1">Barbero: {selectedBarber?.name}</div>
        <div className="text-light mb-1">
          Fecha: {fromDateKey(day).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div className="text-light mb-1">Horario: {hours.time}</div>
        <div className="text-light mb-1">
          Servicio: {selectedCut?.name} — ${Number(selectedCut?.price ?? 0).toLocaleString("es-AR")}
        </div>
        <p className="text-secondary small mt-2 mb-0">
          El turno se confirma al pagarlo con Mercado Pago. Tenés 30 minutos para completar el pago; si no, el horario se libera.
        </p>

        {confirmError && (
          <div className="alert alert-danger py-2 mt-3" style={{ fontSize: "0.85rem" }} role="alert">
            {confirmError.message}
            {confirmError.code === "email_not_verified" && (
              <div className="mt-2">
                {resendState === "sent" ? (
                  <span>Te reenviamos el mail. Revisá tu bandeja de entrada (y la de spam).</span>
                ) : (
                  <button className="btn btn-sm btn-outline-light" onClick={resend} disabled={resendState === "sending"}>
                    {resendState === "sending" ? "Enviando…" : "Reenviar el mail de verificación"}
                  </button>
                )}
                {resendState && !["sent", "sending"].includes(resendState) && <div className="mt-1">{resendState}</div>}
              </div>
            )}
          </div>
        )}

        {result ? (
          <div className="alert alert-warning mt-3 mb-0" role="status">
            Reservamos el horario, pero no pudimos abrir el pago en este momento. Entrá a "Mis turnos" y tocá "Pagar" para completarlo.
            <div className="mt-2">
              <button className="btn btn-sm btn-dark" onClick={() => navigate("/my-account/appointments")}>Ir a Mis turnos</button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-warning text-dark mt-3 w-100"
            onClick={handleConfirm}
            disabled={confirmLoading}
          >
            {confirmLoading ? "Abriendo el pago…" : "Confirmar y pagar"}
          </button>
        )}
      </div>

      {showModal && (
        <>
          <div
            className="modal show d-block"
            tabIndex="-1"
            {...backdropClose(closeModal)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content bg-dark border-warning">
                <div className="modal-header border-warning">
                  <h5 className="modal-title text-warning">
                    {view === "login" ? "Iniciar sesión" : "Crear cuenta"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={closeModal}
                    aria-label="Cerrar"
                  />
                </div>
                <div className="modal-body">
                  {view === "login" ? (
                    <Login
                      onLogin={handleAuthenticated}
                      onCancel={handleLoginCancel}
                    />
                  ) : (
                    <Register
                      onRegister={handleAuthenticated}
                      onCancel={() => setView("login")}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}
    </>
  );
}

export default AppointmentForm;
