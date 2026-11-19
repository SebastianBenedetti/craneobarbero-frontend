import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import AuthCard from "../../components/AuthCard/AuthCard";
import { useAuth } from "../../context/AuthContext";
import { verifyEmail } from "../../services/account.services";

function VerifyEmailPage() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  const token = params.get("token");
  const [state, setState] = useState(
    token ? { loading: true } : { loading: false, error: "El enlace no es válido. Pedí uno nuevo desde Mi cuenta." },
  );
  const sent = useRef(false);

  useEffect(() => {
    document.title = " Verificar email | Cráneo Barbero";
  }, []);

  useEffect(() => {
    if (!token || sent.current) return;
    sent.current = true;
    verifyEmail(token)
      .then((data) => setState({ loading: false, message: data?.message ?? "Tu email quedó verificado." }))
      .catch((err) => setState({ loading: false, error: err.message }));
  }, [token]);

  return (
    <AuthCard title="Verificar email">
      {state.loading && <p className="text-secondary text-center mb-0">Verificando tu email…</p>}
      {state.message && (
        <>
          <p className="text-success text-center" role="status">{state.message}</p>
          <p className="text-secondary text-center">Ya podés sacar turnos y pagarlos online.</p>
          <Link to={user ? "/appointment" : "/login"} className="btn btn-warning text-dark w-100">
            {user ? "Sacar turno" : "Iniciar sesión"}
          </Link>
        </>
      )}
      {state.error && (
        <>
          <p className="text-danger text-center" role="alert">{state.error}</p>
          <Link to={user ? "/my-account" : "/login"} className="btn btn-outline-warning w-100">
            {user ? "Ir a Mi cuenta" : "Iniciar sesión"}
          </Link>
        </>
      )}
    </AuthCard>
  );
}

export default VerifyEmailPage;
