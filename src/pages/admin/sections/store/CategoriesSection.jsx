import { useState } from "react";
import Toast from "../../../../components/Toast/Toast";
import { createCategory, updateCategory } from "../../../../services/store.services";
import { backdropClose } from "../../../../utils/backdrop";
import { INPUT_CLASS } from "./shared";

function CategoriesSection({ categories, onChanged }) {
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const open = (category) => {
    setEditing(category);
    setName(category?.name ?? "");
    setError("");
  };

  const close = () => setEditing(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing.id) await updateCategory(editing.id, name.trim());
      else await createCategory(name.trim());
      setToast(editing.id ? "Categoría actualizada" : "Categoría creada");
      close();
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="admin-section-header">
        <h2 className="admin-section-title">Categorías</h2>
        <button className="btn btn-warning text-dark" onClick={() => open({})}>+ Agregar categoría</button>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr><th>Nombre</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr><td colSpan={2} className="text-secondary text-center">Todavía no hay categorías</td></tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-warning" onClick={() => open(c)}>Editar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="admin-modal-overlay" {...backdropClose(close)}>
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="category-title">
            <h3 id="category-title" className="admin-modal-title">{editing.id ? "Editar categoría" : "Agregar categoría"}</h3>
            <form onSubmit={submit}>
              <label htmlFor="category-name" className="admin-form-label">Nombre</label>
              <input
                id="category-name"
                className={INPUT_CLASS}
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                minLength={2}
                maxLength={100}
                required
                autoFocus
              />
              {error && <p className="text-danger small mt-2" role="alert">{error}</p>}
              <div className="d-flex gap-2 mt-4">
                <button type="button" className="btn btn-outline-secondary w-100" onClick={close} disabled={saving}>Cancelar</button>
                <button type="submit" className="btn btn-warning text-dark w-100" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default CategoriesSection;
