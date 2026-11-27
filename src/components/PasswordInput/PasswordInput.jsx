import { useState } from "react";
import "../../styles/passwordInput.css";

function PasswordInput({ ref, className = "", ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input">
      <input ref={ref} {...props} type={visible ? "text" : "password"} className={`${className} password-input-field`} />
      <button
        type="button"
        className="password-input-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        <i className={`ti ${visible ? "ti-eye-off" : "ti-eye"}`} aria-hidden="true" />
      </button>
    </div>
  );
}

export default PasswordInput;
