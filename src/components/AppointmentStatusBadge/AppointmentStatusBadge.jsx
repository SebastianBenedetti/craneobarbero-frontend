import "../../styles/appointmentStatus.css";
import { appointmentStatus } from "../../utils/appointmentStatus";

function AppointmentStatusBadge({ appointment, forClient = false }) {
  const { tone, label } = appointmentStatus(appointment, { forClient });
  return <span className={`status-badge status-badge-${tone}`}>{label}</span>;
}

export default AppointmentStatusBadge;
