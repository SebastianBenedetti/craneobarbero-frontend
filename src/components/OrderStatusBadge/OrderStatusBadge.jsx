import { getOrderBadge } from "../../utils/orderStatus";
import "../../styles/appointmentStatus.css";

function OrderStatusBadge({ order, forClient = false }) {
  const { label, className } = getOrderBadge(order, { forClient });
  return <span className={`status-badge ${className}`}>{label}</span>;
}

export default OrderStatusBadge;
