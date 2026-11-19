import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import AuthCard from "../../components/AuthCard/AuthCard";
import { resetPassword } from "../../services/account.services";
import { isStrongPassword, PASSWORD_POLICY } from "../../utils/password";

function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = " Nueva contraseña | Cráneo Barbero";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isStrongPassword(password)) {
      setError(PASSWORD_POLICY);
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthCard title="Nueva contraseña">
        <p className="text-danger" role="alert">El enlace no es válido. Pedí uno nuevo.</p>
        <Link to="/forgot-password" className="btn btn-outline-warning w-100">Pedir un enlace nuevo</Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Nueva contraseña">
        <p className="text-success text-center" role="status">Tu contraseña se cambió. Ya podés iniciar sesión.</p>
        <Link to="/login" className="btn btn-warning text-dark w-100">Iniciar sesión</Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Nueva contraseña">
      <form onSubmit={handleSubmit}>
        <label htmlFor="reset-password" className="form-label text-light">Contraseña nueva</label>
        <input
          id="reset-password"
          type="password"
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(""); }}
          className="form-control bg-secondary text-white border-secondary mb-1"
        />
        <p className="text-secondary mb-3" style={{ fontSize: "13px" }}>{PASSWORD_POLICY}</p>
        <label htmlFor="reset-confirm" className="form-label text-light">Repetir contraseña</label>
        <input
          id="reset-confirm"
          type="password"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); setError(""); }}
          className="form-control bg-secondary text-white border-secondary mb-3"
        />
        {error && (
          <div className="mb-3" role="alert">
            <p className="text-danger mb-1" style={{ fontSize: "14px" }}>{error}</p>
            <Link to="/forgot-password" className="text-warning" style={{ fontSize: "14px" }}>Pedir un enlace nuevo</Link>
          </div>
        )}
        <button type="submit" className="btn btn-warning text-dark w-100" disabled={loading}>
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </AuthCard>
  );
}

export default ResetPasswordPage;
