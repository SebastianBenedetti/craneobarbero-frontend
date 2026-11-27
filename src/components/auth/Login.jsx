
import { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import PasswordInput from "../PasswordInput/PasswordInput";
import { loginService } from "./auth.services";

const Login = ({ onLogin, onCancel, context, subtitle = "Iniciá sesión para confirmar tu turno" }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // errores de validación por campo, se muestran debajo de cada input
  const [error, setErrors] = useState({ email: false, password: false });
  // error que viene del servidor (credenciales inválidas, usuario no encontrado, etc.)
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  // refs para enfocar el campo con error al hacer submit sin necesidad de re-render extra
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const navigate = useNavigate();

  // Limpia el error del campo mientras el usuario escribe para dar feedback inmediato
  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    setErrors({ ...error, email: false });
    setServerError("");
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setErrors({ ...error, password: false });
    setServerError("");
  };

  const handleLogin = (event) => {
    event.preventDefault();

    // Validación del lado del cliente antes de hacer la petición al servidor
    if (!email.trim()) {
      setErrors({ ...error, email: true });
      emailRef.current.focus();
      return;
    }
    if (!password) {
      setErrors({ ...error, password: true });
      passwordRef.current.focus();
      return;
    }

    setLoading(true);
    loginService(
      email,
      password,
      ({ token }) => {
        // Guardamos el token en localStorage para persistir la sesión entre recargas de página
        localStorage.setItem("barberia-token", token);
        setLoading(false);
        onLogin(token); // le avisamos al padre que el login fue exitoso para que actualice el AuthContext
      },
      (err) => {
        setServerError(err.message);
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    document.title = "Iniciar sesión | Cráneo Barbero";
  }, []);

  return (
    <form onSubmit={handleLogin}>
      <p className="text-warning mb-4">{subtitle}</p>

      <div className="mb-3">
        <input
          type="email"
          required
          ref={emailRef}
          placeholder="Ingresar email"
          onChange={handleEmailChange}
          value={email}
          className={`form-control bg-secondary text-white border-${error.email ? "danger" : "secondary"}`}
        />
        {error.email && (
          <p
            className="text-danger"
            style={{ fontSize: "13px", marginTop: "4px" }}
          >
            Por favor ingresá tu email.
          </p>
        )}
      </div>

      <div className="mb-4">
        <PasswordInput
          required
          ref={passwordRef}
          placeholder="Ingresar contraseña"
          onChange={handlePasswordChange}
          value={password}
          className={`form-control bg-secondary text-white border-${error.password ? "danger" : "secondary"}`}
        />
        {error.password && (
          <p
            className="text-danger"
            style={{ fontSize: "13px", marginTop: "4px" }}
          >
            Ingresá tu contraseña.
          </p>
        )}
        <div className="text-end mt-2">
          <Link to="/forgot-password" className="text-warning" style={{ fontSize: "13px" }} onClick={() => context === "modal" && onCancel?.()}>
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </div>

      {serverError && (
        <p
          className="text-danger text-center mb-3"
          style={{ fontSize: "14px" }}
        >
          {serverError}
        </p>
      )}

      <div className="d-flex gap-2 mb-3">
        {/* El botón secundario cambia según el contexto donde se renderiza el formulario */}
        {context === "modal" && (
          <button
            type="button"
            className="btn btn-outline-secondary w-100"
            onClick={onCancel}
            disabled={loading}
          >
            Cerrar
          </button>
        )}
        {context === "navbar" && (
          <button
            type="button"
            className="btn btn-outline-secondary w-100"
            onClick={() => navigate(-1)} // es lo mismo que el boton que va atras en el navegador
            disabled={loading}
          >
            Volver
          </button>
        )}

        <button
          type="submit"
          className="btn btn-warning text-dark w-100"
          disabled={loading}
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
      </div>

      <hr className="border-secondary" />
      <p
        className="text-center text-secondary mb-2"
        style={{ fontSize: "14px" }}
      >
        ¿No tenés cuenta?
      </p>
      {/* onCancel("register") le avisa al padre que el usuario quiere ir al formulario de registro */}
      <button
        type="button"
        className="btn btn-outline-warning w-100"
        onClick={() => onCancel("register")}
        disabled={loading}
      >
        Crear cuenta nueva
      </button>
    </form>
  );
};

export default Login;
