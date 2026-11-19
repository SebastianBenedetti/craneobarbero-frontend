import "../../styles/appointmentModal.css";
import AppointmentStatusBadge from "../AppointmentStatusBadge/AppointmentStatusBadge";

const CANCELLATION_REASONS = {
  schedule_removed: "Se eliminaron los horarios de la agenda",
  barber_branch_change: "El barbero cambió de sucursal",
};

const PAYMENT_LABELS = {
  mercadopago: "Mercado Pago",
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  wallet: "Billetera virtual",
};

function AppointmentModal({ appointment, onClose }) {
  if (!appointment) return null;

  const date = new Date(appointment.appointmentDate);
  const day = date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const time = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Detalle del turno</h3>
        <div className="modal-row"><span className="modal-label">Día:</span><span>{day}</span></div>
        <div className="modal-row"><span className="modal-label">Horario:</span><span>{time}</span></div>
        <div className="modal-row"><span className="modal-label">Servicio:</span><span>{appointment.cut?.name || appointment.Cut?.name || "—"}</span></div>
        <div className="modal-row"><span className="modal-label">Cliente:</span><span>{appointment.client?.name || appointment.clientName || "—"}</span></div>
        {appointment.client?.phone && (
          <div className="modal-row"><span className="modal-label">Teléfono:</span><span>{appointment.client.phone}</span></div>
        )}
        {appointment.client?.email && (
          <div className="modal-row"><span className="modal-label">Email:</span><span>{appointment.client.email}</span></div>
        )}
        <div className="modal-row"><span className="modal-label">Precio:</span><span>${Number(appointment.price ?? 0).toLocaleString("es-AR")}</span></div>
        <div className="modal-row"><span className="modal-label">Medio de pago:</span><span>{PAYMENT_LABELS[appointment.paymentMethod] || "—"}</span></div>
        <div className="modal-row"><span className="modal-label">Estado:</span><span><AppointmentStatusBadge appointment={appointment} /></span></div>
        {appointment.cancellationReason && (
          <div className="modal-row"><span className="modal-label">Motivo de cancelación:</span><span>{CANCELLATION_REASONS[appointment.cancellationReason] || appointment.cancellationReason}</span></div>
        )}
        <button className="modal-close" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

export default AppointmentModal;
