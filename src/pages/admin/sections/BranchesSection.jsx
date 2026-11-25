import { useState, useEffect } from "react";
import {
  getAllBranchesAdminService,
  createBranchAdminService,
  updateBranchAdminService,
  setBranchActiveAdminService,
} from "../../../services/admin.services";
import PaginationControls from "../../../components/PaginationControls/PaginationControls";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import Toast from "../../../components/Toast/Toast";
import { IMAGE_URL_HINT, IMAGE_URL_PATTERN } from "../../../utils/image";
import { backdropClose } from "../../../utils/backdrop";

const EMPTY_FORM = { name: "", address: "", phone: "", imageUrl: "" };

function BranchesSection() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showForm, setShowForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [togglingBranch, setTogglingBranch] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const loadBranches = () => {
    getAllBranchesAdminService(
      (data) => { setBranches(data); setLoading(false); },
      () => { setError("No se pudieron cargar las sucursales"); setLoading(false); }
    );
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setForm({ name: branch.name, address: branch.address, phone: branch.phone || "", imageUrl: branch.imageUrl || "" });
    setFormError("");
    setShowForm(true);
  };

  const handleOpenCreate = () => {
    setEditingBranch(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBranch(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.address.trim()) {
      setFormError("El nombre y la dirección son obligatorios");
      return;
    }

    setFormLoading(true);

    const onSaved = (message) => () => {
      setFormLoading(false);
      handleCloseForm();
      loadBranches();
      showToast(message);
    };
    const onFailed = (err) => { setFormLoading(false); setFormError(err.message); };

    if (editingBranch) {
      updateBranchAdminService(editingBranch.id, form, onSaved("Sucursal actualizada correctamente"), onFailed);
    } else {
      createBranchAdminService(form, onSaved("Sucursal creada correctamente"), onFailed);
    }
  };

  const handleConfirmToggle = () => {
    if (!togglingBranch) return;
    const activate = !togglingBranch.isActive;
    setBranchActiveAdminService(
      togglingBranch.id,
      activate,
      () => {
        setTogglingBranch(null);
        loadBranches();
        showToast(activate ? "Sucursal reactivada" : "Sucursal desactivada");
      },
      (err) => { setTogglingBranch(null); showToast(err.message, "danger"); }
    );
  };

  const totalPages = Math.ceil(branches.length / pageSize);
  const paginated = branches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Sucursales</h2>
        <button className="btn btn-warning text-dark" onClick={handleOpenCreate}>
          + Agregar sucursal
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
                  <th>Dirección</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-secondary text-center">
                      No hay sucursales registradas
                    </td>
                  </tr>
                ) : (
                  paginated.map((branch) => (
                    <tr key={branch.id} className={branch.isActive ? "" : "admin-row-inactive"}>
                      <td>{branch.name}</td>
                      <td>{branch.address}</td>
                      <td>{branch.phone || "—"}</td>
                      <td>
                        <span className={`admin-status-badge ${branch.isActive ? "admin-status-badge-active" : "admin-status-badge-inactive"}`}>
                          {branch.isActive ? "Activa" : "Desactivada"}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="btn btn-sm btn-outline-warning"
                            onClick={() => handleOpenEdit(branch)}
                          >
                            Editar
                          </button>
                          <button
                            className={`btn btn-sm ${branch.isActive ? "btn-outline-danger" : "btn-outline-success"}`}
                            onClick={() => setTogglingBranch(branch)}
                          >
                            {branch.isActive ? "Desactivar" : "Reactivar"}
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
            total={branches.length}
          />
        </>
      )}

      {showForm && (
        <div className="admin-modal-overlay" {...backdropClose(handleCloseForm)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">
              {editingBranch ? "Editar sucursal" : "Agregar sucursal"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="branch-name" className="admin-form-label">Nombre</label>
                <input
                  id="branch-name"
                  type="text"
                  name="name"
                  placeholder="Ej.: Sucursal Centro"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={100}
                  className="form-control bg-secondary text-white border-secondary"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="branch-address" className="admin-form-label">Dirección</label>
                <input
                  id="branch-address"
                  type="text"
                  name="address"
                  placeholder="Dirección"
                  value={form.address}
                  onChange={handleChange}
                  maxLength={200}
                  className="form-control bg-secondary text-white border-secondary"
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="branch-phone" className="admin-form-label">Teléfono de contacto</label>
                <input
                  id="branch-phone"
                  type="tel"
                  name="phone"
                  placeholder="Teléfono (opcional)"
                  value={form.phone}
                  onChange={handleChange}
                  maxLength={30}
                  className="form-control bg-secondary text-white border-secondary"
                />
                <p className="admin-form-hint">Es el número que ven los clientes al sacar un turno en esta sucursal.</p>
              </div>
              <div className="mb-4">
                <label htmlFor="branch-image" className="admin-form-label">Imagen</label>
                <input
                  id="branch-image"
                  type="text" inputMode="url" pattern={IMAGE_URL_PATTERN} title={IMAGE_URL_HINT}
                  name="imageUrl"
                  placeholder="URL de imagen (opcional)"
                  value={form.imageUrl}
                  onChange={handleChange}
                  maxLength={500}
                  className="form-control bg-secondary text-white border-secondary"
                />
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="Vista previa de la sucursal"
                    style={{ width: "100%", maxHeight: "120px", objectFit: "cover", borderRadius: "6px", marginTop: "8px", border: "2px solid #ffc107" }}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
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

      {togglingBranch && (
        <ConfirmModal
          title={togglingBranch.isActive ? "Desactivar sucursal" : "Reactivar sucursal"}
          message={
            togglingBranch.isActive
              ? `La sucursal "${togglingBranch.name}" y sus barberos dejan de aparecer en la reserva de turnos. El historial se conserva y podés reactivarla cuando quieras.`
              : `La sucursal "${togglingBranch.name}" vuelve a aparecer en la reserva de turnos.`
          }
          onConfirm={handleConfirmToggle}
          onCancel={() => setTogglingBranch(null)}
          confirmLabel={togglingBranch.isActive ? "Desactivar" : "Reactivar"}
          confirmClass={togglingBranch.isActive ? "btn btn-danger" : "btn btn-success"}
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

export default BranchesSection;
