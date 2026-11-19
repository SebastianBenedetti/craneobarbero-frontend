import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import Toast from "../../components/Toast/Toast";
import AccountClosureModal from "../../components/AccountClosureModal/AccountClosureModal";
import {
  changeMyPassword,
  deactivateMyAccount,
  deleteMyAccount,
  getMe,
  getMyClosurePreview,
  resendVerification,
  updateMe,
} from "../../services/account.services";
import { isStrongPassword, PASSWORD_POLICY } from "../../utils/password";
import "../../styles/myAccount.css";

const INPUT = "form-control bg-secondary text-white border-secondary";

function ProfileForm({ me, onSaved }) {
  const [form, setForm] = useState({ name: me.name, phone: me.phone ?? "", imageUrl: me.imageUrl ?? "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isBarber = me.role === "barber";

  const change = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateMe({ name: form.name, phone: isBarber ? null : form.phone, imageUrl: form.imageUrl });
      onSaved(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="account-card">
      <h2 className="account-card-title">Mis datos</h2>
      <label className="form-label text-light" htmlFor="account-name">Nombre</label>
      <input id="account-name" name="name" className={`${INPUT} mb-3`} value={form.name} onChange={change} required maxLength={100} />
      {!isBarber && (
        <>
          <label className="form-label text-light" htmlFor="account-phone">Teléfono (opcional)</label>
          <input id="account-phone" name="phone" type="tel" className={`${INPUT} mb-3`} value={form.phone} onChange={change} maxLength={30} />
        </>
      )}
      <label className="form-label text-light" htmlFor="account-image">Foto (dirección web, opcional)</label>
      <input id="account-image" name="imageUrl" type="url" className={`${INPUT} mb-3`} value={form.imageUrl} onChange={change} maxLength={500} placeholder="https://…" />
      {error && <p className="text-danger" role="alert" style={{ fontSize: "14px" }}>{error}</p>}
      <button type="submit" className="btn btn-warning text-dark" disabled={saving}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function PasswordForm({ onSaved }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const change = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!isStrongPassword(form.next)) {
      setError(PASSWORD_POLICY);
      return;
    }
    if (form.next !== form.confirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await changeMyPassword(form.current, form.next);
      setForm({ current: "", next: "", confirm: "" });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="account-card" id="password">
      <h2 className="account-card-title">Cambiar contraseña</h2>
      <label className="form-label text-light" htmlFor="password-current">Contraseña actual</label>
      <input id="password-current" name="current" type="password" autoComplete="current-password" className={`${INPUT} mb-3`} value={form.current} onChange={change} required />
      <label className="form-label text-light" htmlFor="password-next">Contraseña nueva</label>
      <input id="password-next" name="next" type="password" autoComplete="new-password" className={`${INPUT} mb-1`} value={form.next} onChange={change} required />
      <p className="text-secondary mb-3" style={{ fontSize: "13px" }}>{PASSWORD_POLICY}</p>
      <label className="form-label text-light" htmlFor="password-confirm">Repetir contraseña nueva</label>
      <input id="password-confirm" name="confirm" type="password" autoComplete="new-password" className={`${INPUT} mb-3`} value={form.confirm} onChange={change} required />
      {error && <p className="text-danger" role="alert" style={{ fontSize: "14px" }}>{error}</p>}
      <button type="submit" className="btn btn-warning text-dark" disabled={saving}>
        {saving ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}

function MyAccountPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState(null);
  const [closing, setClosing] = useState(null);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    document.title = " Mi cuenta | Cráneo Barbero";
    getMe().then(setMe).catch((err) => setLoadError(err.message));
  }, []);

  const loadPreview = useCallback(() => getMyClosurePreview(), []);

  const resend = async () => {
    setResending(true);
    try {
      await resendVerification();
      setToast({ message: "Te enviamos el mail de verificación. Revisá tu casilla (y el spam).", type: "success" });
    } catch (err) {
      setToast({ message: err.message, type: "danger" });
    } finally {
      setResending(false);
    }
  };

  const confirmClosure = async (password) => {
    if (closing === "delete") await deleteMyAccount(password);
    else await deactivateMyAccount(password);
    logout();
    navigate("/", { replace: true });
  };

  if (loadError) {
    return <div className="account-page"><p className="text-danger">{loadError}</p></div>;
  }

  if (!me) {
    return <div className="account-page"><p className="text-secondary">Cargando…</p></div>;
  }

  const isClient = me.role === "client";

  return (
    <div className="account-page page-transition">
      <h1 className="account-title">Mi cuenta</h1>

      <section className="account-card">
        <h2 className="account-card-title">Email</h2>
        <p className="text-light mb-1">{me.email}</p>
        <p className="text-secondary mb-2" style={{ fontSize: "13px" }}>El email no se puede cambiar.</p>
        {isClient && (me.emailVerified ? (
          <span className="account-badge account-badge-ok">Verificado</span>
        ) : (
          <div>
            <span className="account-badge account-badge-warn">Sin verificar</span>
            <p className="text-secondary mt-2 mb-2" style={{ fontSize: "14px" }}>
              Para sacar turnos tenés que verificar tu email con el enlace que te mandamos.
            </p>
            <button type="button" className="btn btn-outline-warning btn-sm" onClick={resend} disabled={resending}>
              {resending ? "Enviando…" : "Reenviar el mail de verificación"}
            </button>
          </div>
        ))}
      </section>

      <ProfileForm
        me={me}
        onSaved={(updated) => {
          setMe(updated);
          setToast({ message: "Tus datos se guardaron.", type: "success" });
        }}
      />

      <PasswordForm onSaved={() => setToast({ message: "Tu contraseña se cambió.", type: "success" })} />

      {isClient && (
        <section className="account-card account-card-danger">
          <h2 className="account-card-title">Dar de baja mi cuenta</h2>
          <p className="text-secondary" style={{ fontSize: "14px" }}>
            <strong className="text-light">Desactivar:</strong> no vas a poder ingresar y solo el local puede reactivarla; se conserva tu historial.
          </p>
          <p className="text-secondary" style={{ fontSize: "14px" }}>
            <strong className="text-light">Eliminar:</strong> se borran tus datos personales para siempre; los turnos pasados quedan sin tu nombre.
          </p>
          <p className="text-secondary" style={{ fontSize: "14px" }}>
            En los dos casos se cancelan tus turnos futuros (con reembolso si faltan 4 horas o más y lo pagaste online).
          </p>
          <div className="d-flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline-warning" onClick={() => setClosing("deactivate")}>
              Desactivar cuenta
            </button>
            <button type="button" className="btn btn-outline-danger" onClick={() => setClosing("delete")}>
              Eliminar cuenta
            </button>
          </div>
        </section>
      )}

      {closing && (
        <AccountClosureModal
          mode={closing}
          loadPreview={loadPreview}
          requirePassword
          onConfirm={confirmClosure}
          onClose={() => setClosing(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default MyAccountPage;
