// Formulario de registro de nuevos usuarios
// Al completarse exitosamente llama a onRegister(token) con el JWT generado por el backend,
// de modo que el usuario queda logueado automáticamente sin necesidad de hacer login aparte.
//
// Props:
//   onRegister(token) → callback que ejecuta el padre cuando el registro fue exitoso (recibe el JWT)
//   onCancel()        → callback para cerrar el formulario o volver al login

import "../../styles/legal.css";
import { useRef, useState } from "react";
import { Link } from "react-router";
import { registerService } from "./auth.services";
import PasswordInput from "../PasswordInput/PasswordInput";
import { isStrongPassword, PASSWORD_POLICY } from "../../utils/password";

const Register = ({ onRegister, onCancel, subtitle = "Creá tu cuenta para confirmar el turno" }) => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [acceptTerms, setAcceptTerms] = useState(false);
    // errores por campo para mostrar mensajes de validación debajo de cada input
    const [error, setErrors] = useState({ name: false, email: false, password: false, confirmPassword: false, terms: false });
    // error que viene del servidor (email duplicado, validación de Sequelize, etc.)
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    // refs para enfocar el campo con error sin perder el estado del formulario
    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    // Limpia el error de un campo específico mientras el usuario escribe
    const clearError = (field) => {
        setErrors((prev) => ({ ...prev, [field]: false }));
        setServerError("");
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        // Validamos en orden: si un campo falla, enfocamos ese campo y salimos sin continuar
        if (!name.trim()) {
            setErrors({ ...error, name: true });
            nameRef.current.focus();
            return;
        }
        if (!email.trim()) {
            setErrors({ ...error, email: true });
            emailRef.current.focus();
            return;
        }
        if (!isStrongPassword(password)) {
            setErrors({ ...error, password: true });
            passwordRef.current.focus();
            return;
        }
        if (password !== confirmPassword) {
            setErrors({ ...error, confirmPassword: true });
            confirmPasswordRef.current.focus();
            return;
        }
        if (!acceptTerms) {
            setErrors({ ...error, terms: true });
            return;
        }

        setLoading(true);
        registerService(
            name,
            email,
            password,
            acceptTerms,
            (data) => {
                setLoading(false);
                onRegister(data.token); // el backend devuelve un JWT listo para usar
            },
            (err) => {
                // Normalizamos el error de email duplicado: Sequelize puede devolver "Validation error" o "unique"
                const msg = err.message?.toLowerCase();
                if (msg?.includes("validation error") || msg?.includes("unique")) {
                    setServerError("Email ya registrado");
                } else {
                    setServerError(err.message);
                }
                setLoading(false);
            }
        );
    };

    return (
        <form onSubmit={handleSubmit}>
            <p className="text-warning mb-4">{subtitle}</p>

            <div className="mb-3">
                <input
                    type="text"
                    required
                    ref={nameRef}
                    placeholder="Nombre completo"
                    onChange={(e) => { setName(e.target.value); clearError("name"); }}
                    value={name}
                    className={`form-control bg-secondary text-white border-${error.name ? "danger" : "secondary"}`}
                />
                {error.name && (
                    <p className="text-danger" style={{ fontSize: "13px", marginTop: "4px" }}>
                        Por favor ingresá tu nombre.
                    </p>
                )}
            </div>

            <div className="mb-3">
                <input
                    type="email"
                    required
                    ref={emailRef}
                    placeholder="Email"
                    onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                    value={email}
                    className={`form-control bg-secondary text-white border-${error.email ? "danger" : "secondary"}`}
                />
                {error.email && (
                    <p className="text-danger" style={{ fontSize: "13px", marginTop: "4px" }}>
                        Por favor ingresá tu email.
                    </p>
                )}
            </div>

            <div className="mb-3">
                <PasswordInput
                    required
                    ref={passwordRef}
                    placeholder="Contraseña (mínimo 8, con letras y números)"
                    onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                    value={password}
                    className={`form-control bg-secondary text-white border-${error.password ? "danger" : "secondary"}`}
                />
                {error.password && (
                    <p className="text-danger" style={{ fontSize: "13px", marginTop: "4px" }}>
                        {PASSWORD_POLICY}
                    </p>
                )}
            </div>

            <div className="mb-4">
                <PasswordInput
                    required
                    ref={confirmPasswordRef}
                    placeholder="Repetir contraseña"
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
                    value={confirmPassword}
                    className={`form-control bg-secondary text-white border-${error.confirmPassword ? "danger" : "secondary"}`}
                />
                {error.confirmPassword && (
                    <p className="text-danger" style={{ fontSize: "13px", marginTop: "4px" }}>
                        Las contraseñas no coinciden.
                    </p>
                )}
            </div>

            <div className="mb-4">
                <label className="terms-check">
                    <input
                        type="checkbox"
                        aria-label="Acepto los términos y condiciones y la política de privacidad"
                        checked={acceptTerms}
                        onChange={(e) => { setAcceptTerms(e.target.checked); clearError("terms"); }}
                    />
                    <span>
                        Leí y acepto los{" "}
                        <Link to="/terms" target="_blank" rel="noopener noreferrer">términos y condiciones</Link>{" "}
                        y la{" "}
                        <Link to="/privacy" target="_blank" rel="noopener noreferrer">política de privacidad</Link>.
                    </span>
                </label>
                {error.terms && (
                    <p className="text-danger" style={{ fontSize: "13px", marginTop: "4px" }}>
                        Para crear la cuenta tenés que aceptar los términos y la política de privacidad.
                    </p>
                )}
            </div>

            {serverError && (
                <p className="text-danger text-center mb-3" style={{ fontSize: "14px" }}>
                    {serverError}
                </p>
            )}

            <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary w-100" onClick={onCancel} disabled={loading}>
                    Cancelar
                </button>
                <button type="submit" className="btn btn-warning text-dark w-100" disabled={loading}>
                    {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
            </div>
        </form>
    );
};

export default Register;
