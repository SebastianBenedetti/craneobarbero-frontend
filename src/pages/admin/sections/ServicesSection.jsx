import { useState, useEffect } from "react";
import {
  getAllCutsAdminService,
  createCutAdminService,
  updateCutAdminService,
  setCutActiveAdminService,
} from "../../../services/admin.services";
import PaginationControls from "../../../components/PaginationControls/PaginationControls";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import Toast from "../../../components/Toast/Toast";

const EMPTY_FORM = { name: "", price: "", durationMinutes: "30", description: "" };

function ServicesSection() {
  const [cuts, setCuts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editingCut, setEditingCut] = useState(null);
  const [togglingCut, setTogglingCut] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const loadCuts = () => {
    getAllCutsAdminService(
      (data) => { setCuts(data); setLoading(false); },
      () => { setError("No se pudieron cargar los servicios"); setLoading(false); }
    );
  };

  useEffect(() => {
    loadCuts();
  }, []);

  const handleOpenEdit = (cut) => {
    setEditingCut(cut);
    setForm({
      name: cut.name,
      price: String(cut.price),
      durationMinutes: String(cut.durationMinutes),
      description: cut.description || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const handleOpenCreate = () => {
    setEditingCut(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCut(null);
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
      setFormError("El nombre del servicio es obligatorio");
      return;
    }
    if (form.price === "" || isNaN(Number(form.price)) || Number(form.price) < 0) {
      setFormError("El precio debe ser un número igual o mayor a cero");
      return;
    }
    const duration = Number(form.durationMinutes);
    if (!Number.isInteger(duration) || duration < 1 || duration > 480) {
      setFormError("La duración debe ser un número entero de minutos, entre 1 y 480");
      return;
    }

    setFormLoading(true);

    // convertimos el precio a número porque viene del input como string
    const data = {
      name: form.name,
      price: Number(form.price),
      durationMinutes: duration,
      description: form.description,
    };

    const onSaved = (message) => () => {
      setFormLoading(false);
      handleCloseForm();
      loadCuts();
      showToast(message);
    };
    const onFailed = (err) => { setFormLoading(false); setFormError(err.message); };

    if (editingCut) {
      updateCutAdminService(editingCut.id, data, onSaved("Servicio actualizado correctamente"), onFailed);
    } else {
      createCutAdminService(data, onSaved("Servicio creado correctamente"), onFailed);
    }
  };

  const handleConfirmToggle = () => {
    if (!togglingCut) return;
    const activate = !togglingCut.isActive;
    setCutActiveAdminService(
      togglingCut.id,
      activate,
      () => {
        setTogglingCut(null);
        loadCuts();
        showToast(activate ? "Servicio reactivado" : "Servicio desactivado");
      },
      (err) => { setTogglingCut(null); showToast(err.message, "danger"); }
    );
  };

  const totalPages = Math.ceil(cuts.length / pageSize);
  const paginated = cuts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Servicios</h2>
        <button className="btn btn-warning text-dark" onClick={handleOpenCreate}>
          + Agregar servicio
        </button>
      </div>

      {loading && <p className="text-secondary">Cargando...</p>}
      {error && <p className="text-danger">{error}</p>}

      {!loading && !error && (
        <>
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-secondary text-center">
                      No hay servicios registrados
                    </td>
                  </tr>
                ) : (
                  paginated.map((cut) => (
                    <tr key={cut.id} className={cut.isActive ? "" : "admin-row-inactive"}>
                      <td>
                        {cut.name}
                        {cut.description && (
                          <div className="admin-form-hint">{cut.description}</div>
                        )}
                      </td>
                      <td className="text-warning">
                        ${Number(cut.price).toLocaleString("es-AR")}
                      </td>
                      <td>{cut.durationMinutes} min</td>
                      <td>
                        <span className={`admin-status-badge ${cut.isActive ? "admin-status-badge-active" : "admin-status-badge-inactive"}`}>
                          {cut.isActive ? "Activo" : "Desactivado"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleOpenEdit(cut)}
                          >
                            Editar
                          </button>
                          <button
                            className={`btn btn-sm ${cut.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                            onClick={() => setTogglingCut(cut)}
                          >
                            {cut.isActive ? "Desactivar" : "Reactivar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
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
            total={cuts.length}
          />
        </>
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={handleCloseForm}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">
              {editingCut ? "Editar servicio" : "Agregar servicio"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="cut-name" className="admin-form-label">Nombre</label>
                <input
                  id="cut-name"
                  type="text"
                  name="name"
                  placeholder="Nombre del servicio"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  className="form-control bg-secondary text-white border-secondary"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="cut-price" className="admin-form-label">Precio ($)</label>
                <input
                  id="cut-price"
                  type="number"
                  name="price"
                  placeholder="Precio"
                  value={form.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="form-control bg-secondary text-white border-secondary"
                  required
                />
                {editingCut && (
                  <p className="admin-form-hint">Los turnos ya reservados conservan el precio con el que se reservaron.</p>
                )}
              </div>
              <div className="mb-3">
                <label htmlFor="cut-duration" className="admin-form-label">Duración (minutos)</label>
                <input
                  id="cut-duration"
                  type="number"
                  name="durationMinutes"
                  value={form.durationMinutes}
                  onChange={handleChange}
                  min="1"
                  max="480"
                  step="1"
                  className="form-control bg-secondary text-white border-secondary"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="cut-description" className="admin-form-label">Descripción</label>
                <textarea
                  id="cut-description"
                  name="description"
                  placeholder="Descripción (opcional)"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={500}
                  rows={3}
                  className="form-control bg-secondary text-white border-secondary"
                />
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

      {togglingCut && (
        <ConfirmModal
          title={togglingCut.isActive ? "Desactivar servicio" : "Reactivar servicio"}
          message={
            togglingCut.isActive
              ? `El servicio "${togglingCut.name}" deja de aparecer en la reserva de turnos. El historial se conserva y podés reactivarlo cuando quieras.`
              : `El servicio "${togglingCut.name}" vuelve a aparecer en la reserva de turnos.`
          }
          onConfirm={handleConfirmToggle}
          onCancel={() => setTogglingCut(null)}
          confirmLabel={togglingCut.isActive ? "Desactivar" : "Reactivar"}
          confirmClass={togglingCut.isActive ? "btn btn-danger" : "btn btn-success"}
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

export default ServicesSection;
