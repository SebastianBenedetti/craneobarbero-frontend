import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import Login from "../../components/auth/Login";
import Register from "../../components/auth/Register";
import { useState } from "react";

function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.from;
  const reopenAssistant = Boolean(location.state?.openAssistant);
  const forAppointment = Boolean(returnTo?.startsWith("/appointment"));
  const [view, setView] = useState(location.state?.view === "register" ? "register" : "login");

  useEffect(() => {
    document.title = `${view === "login" ? "Iniciar sesión" : "Crear cuenta"} | Cráneo Barbero`;
  }, [view]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "barber") navigate("/barber", { replace: true });
    else if (user.role === "admin") navigate("/admin", { replace: true });
    else if (returnTo) navigate(returnTo, { replace: true, state: reopenAssistant ? { openAssistant: true } : null });
    else navigate("/", { replace: true });
  }, [user, navigate, returnTo, reopenAssistant]);

  const handleLoginSuccess = (token) => {
    login(token);
  };

  const handleRegisterSuccess = (token) => {
    login(token);
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center page-transition"
      style={{ minHeight: "80vh", paddingTop: "80px" }}
    >
      <div
        className="card bg-dark border-warning p-4"
        style={{ width: "100%", maxWidth: "420px" }}
      >
        <h4 className="text-warning text-center mb-4">
          {view === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </h4>
        {view === "login" ? (
          <Login
            onLogin={handleLoginSuccess}
            context="navbar"
            subtitle={forAppointment ? undefined : "Ingresá con tu email y tu contraseña"}
            onCancel={(action) => {
              if (action === "register") setView("register");
            }}
          />
        ) : (
          <Register
            onRegister={handleRegisterSuccess}
            subtitle={forAppointment ? undefined : "Creá tu cuenta para sacar turnos y comprar en la tienda"}
            onCancel={() => setView("login")}
          />
        )}
      </div>
    </div>
  );
}

export default LoginPage;
