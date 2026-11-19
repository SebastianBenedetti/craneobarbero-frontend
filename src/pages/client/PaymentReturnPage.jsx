import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import AppointmentStatusBadge from "../../components/AppointmentStatusBadge/AppointmentStatusBadge";
import { confirmPaymentReturn, payAppointment } from "../../services/appointments.services";

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const formatDate = (iso) =>
  capitalize(new Date(iso).toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }));

function PaymentReturnPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  const [actionError, setActionError] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    document.title = " Pago | Cráneo Barbero";
  }, []);

  useEffect(() => {
    let cancelled = false;
    confirmPaymentReturn(location.search)
      .then((data) => !cancelled && setState({ loading: false, data, error: "" }))
      .catch((err) => !cancelled && setState({ loading: false, data: null, error: err.message }));
    return () => { cancelled = true; };
  }, [location.search]);

  const retry = async (id) => {
    setPaying(true);
    setActionError("");
    try {
      const { checkoutUrl } = await payAppointment(id);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setActionError(err.message);
      setPaying(false);
    }
  };

  const appointment = state.data?.appointment;
  const confirmed = appointment?.status === "pending" && appointment?.paymentStatus === "paid";
  const waiting = appointment?.status === "awaiting_payment";
  const inProcess = waiting && ["pending", "in_process"].includes(state.data?.gatewayStatus);

  let title = "Revisando tu pago…";
  if (!state.loading) {
    if (state.error) title = "No pudimos confirmar el pago";
    else if (confirmed) title = "¡Listo! Tu turno quedó confirmado";
    else if (inProcess) title = "Tu pago está en proceso";
    else if (waiting) title = "El pago no se completó";
    else title = "Este turno ya no se puede pagar";
  }

  return (
    <div className="page-transition" style={{ maxWidth: "620px", margin: "0 auto", padding: "110px 20px 48px" }}>
      <div className="card bg-dark border-warning p-4">
        <h3 className="text-warning mb-3">{title}</h3>

        {state.loading && <p className="text-secondary mb-0">Estamos consultando el estado del pago con Mercado Pago.</p>}
        {state.error && <p className="text-danger">{state.error}</p>}

        {appointment && (
          <>
            <div className="mb-3"><AppointmentStatusBadge appointment={appointment} forClient /></div>
            <p className="text-light mb-1">{formatDate(appointment.appointmentDate)}</p>
            <p className="text-light mb-1">Servicio: {appointment.cut?.name}</p>
            <p className="text-light mb-1">Barbero: {appointment.barber?.name}</p>
            <p className="text-light mb-3">Sucursal: {appointment.branch?.name} — {appointment.branch?.address}</p>

            {confirmed && <p className="text-secondary">Te enviamos un mail con la confirmación y los botones para agregarlo a tu calendario.</p>}
            {inProcess && <p className="text-secondary">Mercado Pago todavía está procesando el pago. Te avisamos por mail cuando se acredite.</p>}
            {waiting && !inProcess && (
              <p className="text-secondary">
                Podés volver a intentarlo antes de que venza la reserva; si no, el horario se libera.
              </p>
            )}
          </>
        )}

        {actionError && <p className="text-danger" role="alert">{actionError}</p>}

        <div className="d-flex flex-wrap gap-2 mt-2">
          {waiting && !inProcess && (
            <button className="btn btn-warning text-dark" onClick={() => retry(appointment.id)} disabled={paying}>
              {paying ? "Abriendo el pago…" : "Reintentar el pago"}
            </button>
          )}
          <button className="btn btn-outline-warning" onClick={() => navigate("/my-account/appointments")}>
            Ir a Mis turnos
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentReturnPage;
