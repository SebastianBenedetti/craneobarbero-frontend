import { useState, useEffect } from "react";
import {
  getAllBarbersAdminService,
  createBarberAdminService,
  updateBarberAdminService,
  setBarberActiveAdminService,
} from "../../../services/admin.services";
import { getAllBranchesAdminService } from "../../../services/admin.services";
import PaginationControls from "../../../components/PaginationControls/PaginationControls";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import Toast from "../../../components/Toast/Toast";
import { backdropClose } from "../../../utils/backdrop";
import ImageField from "../../../components/ImageField/ImageField";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  branchId: "",
  startDate: "",
  imageUrl: "",
};

const PASSWORD_RULE = /^(?=.*\p{L})(?=.*\d).{8,72}$/u;

function yearsSince(startDate) {
  if (!startDate) return null;
  const [year, month, day] = startDate.split("-").map(Number);
  const today = new Date();
  let years = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) {
    years -= 1;
  }
  return Math.max(years, 0);
}

function todayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function BarbersSection() {
  const [barbers, setBarbers] = useState([]);
  const [branches, setBranches] = useState([]); // las necesitamos para el select de sucursales en el form
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [togglingBarber, setTogglingBarber] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const loadBarbers = () => {
    getAllBarbersAdminService(
      (data) => { setBarbers(data); setLoading(false); },
      () => { setError("No se pudieron cargar los barberos"); setLoading(false); }
    );
  };

  useEffect(() => {
    loadBarbers();
    // cargamos las sucursales para el select del formulario
    getAllBranchesAdminService(
      (data) => setBranches(data),
      () => setBranches([])
    );
  }, []);

  const handleOpenEdit = (barber) => {
    setEditingBarber(barber);
    setForm({
      name: barber.name,
      email: barber.email,
      password: "",
      branchId: String(barber.branchId),
      startDate: barber.startDate || "",
      imageUrl: barber.imageUrl || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleOpenCreate = () => {
    setEditingBarber(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBarber(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }
    if (!form.branchId) {
      setFormError("Elegí la sucursal del barbero");
      return;
    }
    if (!editingBarber && !form.email.trim()) {
      setFormError("El email es obligatorio");
      return;
    }
    if ((!editingBarber || form.password) && !PASSWORD_RULE.test(form.password)) {
      setFormError("La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número");
      return;
    }

    setFormLoading(true);

    const common = {
      name: form.name,
      branchId: Number(form.branchId),
      startDate: form.startDate || null,
      imageUrl: form.imageUrl || null,
    };
    const onFailed = (err) => { setFormLoading(false); setFormError(err.message); };

    if (editingBarber) {
      updateBarberAdminService(
        editingBarber.id,
        { ...common, newPassword: form.password || null },
        () => {
          setFormLoading(false);
          handleCloseForm();
          loadBarbers();
          showToast(form.password ? "Barbero actualizado con su nueva contraseña" : "Barbero actualizado correctamente");
        },
        onFailed
      );
    } else {
      createBarberAdminService(
        { ...common, email: form.email, password: form.password },
        () => { setFormLoading(false); handleCloseForm(); loadBarbers(); showToast("Barbero creado correctamente"); },
        onFailed
      );
    }
  };

  const handleConfirmToggle = () => {
    if (!togglingBarber) return;
    const activate = !togglingBarber.isActive;
    setBarberActiveAdminService(
      togglingBarber.id,
      activate,
      () => {
        setTogglingBarber(null);
        loadBarbers();
        showToast(activate ? "Barbero reactivado" : "Barbero desactivado");
      },
      (err) => { setTogglingBarber(null); showToast(err.message, "danger"); }
    );
  };

  const selectableBranches = branches.filter(
    (b) => b.isActive || (editingBarber && b.id === editingBarber.branchId)
  );

  const filteredBarbers = search.trim()
    ? barbers.filter(
        (b) =>
          b.name.toLowerCase().includes(search.toLowerCase()) ||
          b.email.toLowerCase().includes(search.toLowerCase()),
      )
    : barbers;

  const totalPages = Math.ceil(filteredBarbers.length / pageSize);
  const paginated = filteredBarbers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Barberos</h2>
        <button className="btn btn-warning text-dark" onClick={handleOpenCreate}>
          + Agregar barbero
        </button>
      </div>

      {loading && <p className="text-secondary">Cargando...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && (
        <>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="form-control bg-secondary text-white border-secondary mb-3"
            aria-label="Buscar barberos por nombre o email"
          />
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Sucursal</th>
                  <th>Experiencia</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-secondary text-center">
                      No hay barberos registrados
                    </td>
                  </tr>
                ) : (
                  paginated.map((barber) => {
                    const years = yearsSince(barber.startDate);
                    return (
                      <tr key={barber.id} className={barber.isActive ? "" : "admin-row-inactive"}>
                        <td>{barber.name}</td>
                        <td>{barber.email}</td>
                        <td>
                          {barber.branch.name}
                          {!barber.branchIsActive && (
                            <div className="admin-form-hint">Sucursal desactivada</div>
                          )}
                        </td>
                        <td>{years === null ? "—" : `${years} ${years === 1 ? "año" : "años"}`}</td>
                        <td>
                          <span className={`admin-status-badge ${barber.isActive ? "admin-status-badge-active" : "admin-status-badge-inactive"}`}>
                            {barber.isActive ? "Activo" : "Desactivado"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleOpenEdit(barber)}
                            >
                              Editar
                            </button>
                            <button
                              className={`btn btn-sm ${barber.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                              onClick={() => setTogglingBarber(barber)}
                            >
                              {barber.isActive ? "Desactivar" : "Reactivar"}
                            </button>
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
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
            total={filteredBarbers.length}
          />
        </>
      )}

      {showForm && (
        <div className="admin-modal-overlay" {...backdropClose(handleCloseForm)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">
              {editingBarber ? "Editar barbero" : "Agregar barbero"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="barber-name" className="admin-form-label">Nombre completo</label>
                <input
                  id="barber-name"
                  type="text"
                  name="name"
                  placeholder="Nombre completo"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  className="form-control bg-secondary text-white border-secondary"
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="barber-email" className="admin-form-label">Email</label>
                <input
                  id="barber-email"
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  maxLength={254}
                  className="form-control bg-secondary text-white border-secondary"
                  disabled={Boolean(editingBarber)}
                  required={!editingBarber}
                />
                {editingBarber && (
                  <p className="admin-form-hint">El email no se puede modificar.</p>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="barber-password" className="admin-form-label">
                  {editingBarber ? "Nueva contraseña" : "Contraseña"}
                </label>
                <input
                  id="barber-password"
                  type="password"
                  name="password"
                  placeholder={editingBarber ? "Dejala vacía para no cambiarla" : "Mínimo 8 caracteres, con letras y números"}
                  value={form.password}
                  onChange={handleChange}
                  maxLength={72}
                  autoComplete="new-password"
                  className="form-control bg-secondary text-white border-secondary"
                  required={!editingBarber}
                />
                {editingBarber && (
                  <p className="admin-form-hint">
                    Si la completás, el barbero entra con esta contraseña desde ahora. No se le envía ningún mail.
                  </p>
                )}
              </div>

              {/* select de sucursal para asignarle una al barbero */}
              <div className="mb-3">
                <label htmlFor="barber-branch" className="admin-form-label">Sucursal</label>
                <select
                  id="barber-branch"
                  name="branchId"
                  value={form.branchId}
                  onChange={handleChange}
                  className="form-select bg-secondary text-white border-secondary"
                  required
                >
                  <option value="">Elegí una sucursal</option>
                  {selectableBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}{branch.isActive ? "" : " (desactivada)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label htmlFor="barber-start" className="admin-form-label">Fecha de inicio como barbero</label>
                <input
                  id="barber-start"
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  max={todayInputValue()}
                  min="1950-01-01"
                  className="form-control bg-secondary text-white border-secondary"
                />
                <p className="admin-form-hint">Se usa para calcular los años de experiencia (opcional).</p>
              </div>

              <div className="mb-4">
                <ImageField id="barber-image" label="Foto" value={form.imageUrl} onChange={handleChange} aspect={4 / 3} labelClassName="admin-form-label" inputClassName="form-control bg-secondary text-white border-secondary" />
              </div>

              {formError && (
                <p className="text-danger mb-3" style={{ fontSize: "14px" }}>
                  {formError}
                </p>
              )}

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary w-100"
                  onClick={handleCloseForm}
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-warning text-dark w-100"
                  disabled={formLoading}
                >
                  {formLoading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {togglingBarber && (
        <ConfirmModal
          title={togglingBarber.isActive ? "Desactivar barbero" : "Reactivar barbero"}
          message={
            togglingBarber.isActive
              ? `${togglingBarber.name} no podrá iniciar sesión ni aparecerá en la reserva de turnos. Su historial se conserva y podés reactivarlo cuando quieras.`
              : `${togglingBarber.name} vuelve a poder iniciar sesión y a aparecer en la reserva de turnos.`
          }
          onConfirm={handleConfirmToggle}
          onCancel={() => setTogglingBarber(null)}
          confirmLabel={togglingBarber.isActive ? "Desactivar" : "Reactivar"}
          confirmClass={togglingBarber.isActive ? "btn btn-danger" : "btn btn-success"}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default BarbersSection;
