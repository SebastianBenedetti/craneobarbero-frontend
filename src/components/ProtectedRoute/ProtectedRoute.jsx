import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default ProtectedRoute;
