// archivo principal de rutas de la aplicacion
// aca definimos que componente se renderiza en cada URL
import "./App.css";
import AppRouter from "./components/AppRouter/AppRouter";

// componente que protege rutas segun el rol del usuario
// si no esta logueado lo manda al login
// si esta logueado pero no tiene el rol correcto lo manda al inicio
// si todo esta bien renderiza el contenido (Outlet) de la ruta protegida
function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

function App() {
  return <AppRouter />;
}

export default App;
