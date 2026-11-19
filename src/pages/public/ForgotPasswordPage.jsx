import { useEffect, useState } from "react";
import { Link } from "react-router";
import AuthCard from "../../components/AuthCard/AuthCard";
import { forgotPassword } from "../../services/account.services";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = " Recuperar contraseña | Cráneo Barbero";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await forgotPassword(email.trim());
      setMessage(data?.message ?? "Si el email está registrado, te enviamos un enlace para crear una contraseña nueva.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard title="Recuperar contraseña">
      {message ? (
        <>
          <p className="text-success" role="status">{message}</p>
          <p className="text-secondary" style={{ fontSize: "14px" }}>
            El enlace vence en 1 hora. Revisá también la carpeta de spam.
          </p>
          <Link to="/login" className="btn btn-outline-warning w-100">Volver a iniciar sesión</Link>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <p className="text-secondary" style={{ fontSize: "14px" }}>
            Ingresá el email de tu cuenta y te mandamos un enlace para crear una contraseña nueva.
          </p>
          <label htmlFor="forgot-email" className="form-label text-light">Email</label>
          <input
            id="forgot-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            className="form-control bg-secondary text-white border-secondary mb-3"
          />
          {error && <p className="text-danger" role="alert" style={{ fontSize: "14px" }}>{error}</p>}
          <button type="submit" className="btn btn-warning text-dark w-100 mb-2" disabled={loading}>
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>
          <Link to="/login" className="btn btn-outline-secondary w-100">Volver</Link>
        </form>
      )}
    </AuthCard>
  );
}

export default ForgotPasswordPage;
