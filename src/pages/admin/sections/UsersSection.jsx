import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import PaginationControls from "../../../components/PaginationControls/PaginationControls";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import Toast from "../../../components/Toast/Toast";
import AccountClosureModal from "../../../components/AccountClosureModal/AccountClosureModal";
import {
  activateUser,
  createUser,
  deactivateUser,
  deleteUser,
  getUserClosurePreview,
  listUsers,
  updateUser,
} from "../../../services/users.services";
import { formatMoney } from "../../../utils/dates";
import { isStrongPassword, PASSWORD_POLICY } from "../../../utils/password";
import { backdropClose } from "../../../utils/backdrop";

const INPUT = "form-control bg-secondary text-white border-secondary";
const EMPTY_FORM = { name: "", email: "", password: "", phone: "" };

const LABELS = {
  client: { title: "Clientes", singular: "cliente", add: "+ Agregar cliente", empty: "No hay clientes" },
  admin: { title: "Administradores", singular: "administrador", add: "+ Agregar administrador", empty: "No hay administradores" },
};

const STATUS_FILTERS = [
  { id: "all", label: "Todos", value: undefined },
  { id: "active", label: "Activos", value: true },
  { id: "inactive", label: "Desactivados", value: false },
];

function closureSummary(result) {
  if (!result.cancelledAppointments) return "";
  const cancelled = result.cancelledAppointments === 1 ? "Se canceló 1 turno" : `Se cancelaron ${result.cancelledAppointments} turnos`;
  return result.totalRefunded > 0 ? ` ${cancelled} y se reembolsaron ${formatMoney(result.totalRefunded)}.` : ` ${cancelled}.`;
}

function UserFormModal({ role, user, onClose, onSaved }) {
  const labels = LABELS[role];
  const [form, setForm] = useState(user ? { name: user.name, phone: user.phone ?? "", password: "" } : EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if ((!user || form.password) && !isStrongPassword(form.password)) {
      setError(PASSWORD_POLICY);
      return;
    }
    setSaving(true);
    try {
      const saved = user
        ? await updateUser(user.id, { name: form.name, phone: form.phone, imageUrl: user.imageUrl, newPassword: form.password || undefined })
        : await createUser({ name: form.name, email: form.email, password: form.password, phone: form.phone, role });
      onSaved(saved, !user);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" {...backdropClose(onClose)}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="user-form-title" onClick={(e) => e.stopPropagation()}>
        <h3 className="admin-modal-title" id="user-form-title">
          {user ? `Editar ${labels.singular}` : `Agregar ${labels.singular}`}
        </h3>
        <form onSubmit={submit}>
          <label className="form-label text-light" htmlFor="user-name">Nombre completo</label>
          <input id="user-name" name="name" value={form.name} onChange={change} className={`${INPUT} mb-3`} required maxLength={100} />

          {user ? (
            <p className="text-secondary mb-3" style={{ fontSize: "14px" }}>Email: {user.email} (no se puede cambiar)</p>
          ) : (
            <>
              <label className="form-label text-light" htmlFor="user-email">Email</label>
              <input id="user-email" name="email" type="email" value={form.email} onChange={change} className={`${INPUT} mb-3`} required />
            </>
          )}

          <label className="form-label text-light" htmlFor="user-password">
            {user ? "Contraseña nueva (opcional)" : "Contraseña"}
          </label>
          <input
            id="user-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={change}
            className={`${INPUT} mb-1`}
            required={!user}
          />
          <p className="text-secondary mb-3" style={{ fontSize: "13px" }}>
            {user ? "Si la completás, se cambia sin mandar ningún mail. " : ""}{PASSWORD_POLICY}
          </p>

          <label className="form-label text-light" htmlFor="user-phone">Teléfono (opcional)</label>
          <input id="user-phone" name="phone" type="tel" value={form.phone} onChange={change} className={`${INPUT} mb-3`} maxLength={30} />

          {!user && role === "client" && (
            <p className="text-secondary" style={{ fontSize: "13px" }}>
              Le llega un mail para verificar el email; hasta que lo verifique no puede sacar turnos online.
            </p>
          )}

          {error && <p className="text-danger mb-3" role="alert" style={{ fontSize: "14px" }}>{error}</p>}

          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary w-100" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-warning text-dark w-100" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersSection({ role }) {
  const labels = LABELS[role];
  const { user: currentUser } = useAuth();
  const [result, setResult] = useState({ key: null, data: { items: [], total: 0 }, error: "" });
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState(null);
  const [closing, setClosing] = useState(null);
  const [deactivatingAdmin, setDeactivatingAdmin] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const requestKey = JSON.stringify({ role, status, query, page, pageSize, reload });

  useEffect(() => {
    let cancelled = false;
    const active = STATUS_FILTERS.find((f) => f.id === status)?.value;
    listUsers({ role, active, q: query, page, pageSize })
      .then((data) => !cancelled && setResult({ key: requestKey, data, error: "" }))
      .catch((err) => !cancelled && setResult((prev) => ({ ...prev, key: requestKey, error: err.message })));
    return () => { cancelled = true; };
  }, [requestKey, role, status, query, page, pageSize]);

  const loading = result.key !== requestKey;
  const { data, error } = result;

  const refresh = () => setReload((n) => n + 1);
  const showToast = (message, type = "success") => setToast({ message, type });

  const loadPreview = useCallback(() => getUserClosurePreview(closing.user.id), [closing]);

  const confirmClosure = async () => {
    const { user, mode } = closing;
    const result = mode === "delete" ? await deleteUser(user.id) : await deactivateUser(user.id);
    setClosing(null);
    refresh();
    showToast(`${mode === "delete" ? "Cuenta eliminada." : "Cuenta desactivada."}${closureSummary(result)}`);
  };

  const confirmAdminDeactivation = async () => {
    const user = deactivatingAdmin;
    setDeactivatingAdmin(null);
    try {
      await deactivateUser(user.id);
      refresh();
      showToast("Cuenta desactivada.");
    } catch (err) {
      showToast(err.message, "danger");
    }
  };

  const reactivate = async (user) => {
    try {
      await activateUser(user.id);
      refresh();
      showToast("Cuenta reactivada.");
    } catch (err) {
      showToast(err.message, "danger");
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">{labels.title}</h2>
        <button className="btn btn-warning text-dark" onClick={() => setEditing({ user: null })}>
          {labels.add}
        </button>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <label className="visually-hidden" htmlFor={`users-search-${role}`}>Buscar</label>
        <input
          id={`users-search-${role}`}
          type="search"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={INPUT}
          style={{ flex: "1 1 220px" }}
        />
        <div className="btn-group" role="group" aria-label="Filtrar por estado">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`btn btn-sm ${status === f.id ? "btn-warning text-dark" : "btn-outline-warning"}`}
              onClick={() => { setStatus(f.id); setPage(1); }}
              aria-pressed={status === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-danger">{error}</p>}
      {loading && <p className="text-secondary">Cargando...</p>}

      {!error && (
        <>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {!loading && data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-secondary text-center">{labels.empty}</td>
                  </tr>
                ) : (
                  data.items.map((u) => {
                    const isSelf = u.id === Number(currentUser?.id);
                    return (
                      <tr key={u.id}>
                        <td>{u.name}{isSelf && <span className="text-secondary"> (vos)</span>}</td>
                        <td>
                          {u.email}
                          {role === "client" && !u.emailVerified && (
                            <span className="badge bg-secondary ms-2">Sin verificar</span>
                          )}
                        </td>
                        <td>{u.phone || "—"}</td>
                        <td>
                          <span className={`badge ${u.isActive ? "bg-success" : "bg-secondary"}`}>
                            {u.isActive ? "Activo" : "Desactivado"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button className="btn btn-sm btn-outline-warning" onClick={() => setEditing({ user: u })}>
                              Editar
                            </button>
                            {u.isActive ? (
                              !isSelf && (
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  onClick={() => (role === "client" ? setClosing({ user: u, mode: "deactivate" }) : setDeactivatingAdmin(u))}
                                >
                                  Desactivar
                                </button>
                              )
                            ) : (
                              <button className="btn btn-sm btn-outline-success" onClick={() => reactivate(u)}>
                                Reactivar
                              </button>
                            )}
                            {role === "client" && (
                              <button className="btn btn-sm btn-outline-danger" onClick={() => setClosing({ user: u, mode: "delete" })}>
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            total={data.total}
          />
        </>
      )}

      {editing && (
        <UserFormModal
          role={role}
          user={editing.user}
          onClose={() => setEditing(null)}
          onSaved={(_, created) => {
            setEditing(null);
            refresh();
            showToast(created ? `${labels.singular[0].toUpperCase()}${labels.singular.slice(1)} creado.` : "Cambios guardados.");
          }}
        />
      )}

      {closing && (
        <AccountClosureModal
          mode={closing.mode}
          subjectName={closing.user.name}
          loadPreview={loadPreview}
          onConfirm={confirmClosure}
          onClose={() => setClosing(null)}
        />
      )}

      {deactivatingAdmin && (
        <ConfirmModal
          title="Desactivar administrador"
          message={`${deactivatingAdmin.name} no va a poder iniciar sesión hasta que lo reactives. Tiene que quedar al menos un administrador activo.`}
          onConfirm={confirmAdminDeactivation}
          onCancel={() => setDeactivatingAdmin(null)}
          confirmLabel="Desactivar"
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default UsersSection;
