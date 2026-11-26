import { useState } from "react";
import Toast from "../../../../components/Toast/Toast";
import ConfirmModal from "../../../../components/ConfirmModal/ConfirmModal";
import { updateSupplier } from "../../../../services/store.services";
import SupplierFormModal from "./SupplierFormModal";

function SuppliersSection({ suppliers, onChanged }) {
  const [filter, setFilter] = useState("active");
  const [editing, setEditing] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [toast, setToast] = useState(null);

  const visible = suppliers.filter((s) => (filter === "all" ? true : filter === "active" ? s.isActive : !s.isActive));

  const confirmToggle = async () => {
    const supplier = toggling;
    setToggling(null);
    try {
      const { id, ...rest } = supplier;
      await updateSupplier(id, { ...rest, isActive: !supplier.isActive });
      setToast({ message: supplier.isActive ? "Proveedor desactivado" : "Proveedor reactivado", type: "success" });
      onChanged();
    } catch (err) {
      setToast({ message: err.message, type: "danger" });
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Proveedores</h2>
        <button className="btn btn-warning text-dark" onClick={() => setEditing({})}>+ Agregar proveedor</button>
      </div>

      <div className="admin-filter-row mb-3">
        {[["active", "Activos"], ["inactive", "Desactivados"], ["all", "Todos"]].map(([value, label]) => (
          <button key={value} className={`admin-filter-btn ${filter === value ? "admin-filter-btn-active" : ""}`} onClick={() => setFilter(value)}>
            {label}
          </button>
        ))}
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr><th>Nombre</th><th>Contacto</th><th>Teléfono</th><th>Email</th><th>CUIT</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={7} className="text-secondary text-center">No hay proveedores</td></tr>
            ) : (
              visible.map((s) => (
                <tr key={s.id} className={s.isActive ? "" : "admin-row-inactive"}>
                  <td>{s.name}</td>
                  <td>{s.contactName || "—"}</td>
                  <td>{s.phone || "—"}</td>
                  <td>{s.email || "—"}</td>
                  <td>{s.taxId || "—"}</td>
                  <td>
                    <span className={`admin-status-badge ${s.isActive ? "admin-status-badge-active" : "admin-status-badge-inactive"}`}>
                      {s.isActive ? "Activo" : "Desactivado"}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button className="btn btn-sm btn-outline-warning" onClick={() => setEditing(s)}>Editar</button>
                      <button className={`btn btn-sm ${s.isActive ? "btn-outline-danger" : "btn-outline-success"}`} onClick={() => setToggling(s)}>
                        {s.isActive ? "Desactivar" : "Reactivar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <SupplierFormModal
          supplier={editing.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setToast({ message: editing.id ? "Proveedor actualizado" : "Proveedor creado", type: "success" });
            setEditing(null);
            onChanged();
          }}
        />
      )}

      {toggling && (
        <ConfirmModal
          title={toggling.isActive ? "Desactivar proveedor" : "Reactivar proveedor"}
          message={
            toggling.isActive
              ? `"${toggling.name}" deja de aparecer al registrar compras. Su historial se conserva.`
              : `"${toggling.name}" vuelve a aparecer al registrar compras.`
          }
          onConfirm={confirmToggle}
          onCancel={() => setToggling(null)}
          confirmLabel={toggling.isActive ? "Desactivar" : "Reactivar"}
          confirmClass={toggling.isActive ? "btn btn-danger" : "btn btn-success"}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default SuppliersSection;
