import { useState } from "react";
import { createSupplier, updateSupplier } from "../../../../services/store.services";
import { backdropClose } from "../../../../utils/backdrop";
import { INPUT_CLASS, textOrNull } from "./shared";

const FIELDS = [
  { name: "contactName", label: "Persona de contacto", maxLength: 100 },
  { name: "phone", label: "Teléfono", type: "tel", maxLength: 30 },
  { name: "email", label: "Email", type: "email", maxLength: 254 },
  { name: "taxId", label: "CUIT", maxLength: 20 },
];

function SupplierFormModal({ supplier, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: supplier?.name ?? "",
    contactName: supplier?.contactName ?? "",
    phone: supplier?.phone ?? "",
    email: supplier?.email ?? "",
    taxId: supplier?.taxId ?? "",
    notes: supplier?.notes ?? "",
    isActive: supplier?.isActive ?? true,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: form.name.trim(),
      contactName: textOrNull(form.contactName),
      phone: textOrNull(form.phone),
      email: textOrNull(form.email),
      taxId: textOrNull(form.taxId),
      notes: textOrNull(form.notes),
      isActive: form.isActive,
    };
    try {
      const saved = supplier ? await updateSupplier(supplier.id, body) : await createSupplier(body);
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="admin-modal-overlay" {...backdropClose(onClose)}>
      <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="supplier-title">
        <h3 id="supplier-title" className="admin-modal-title">{supplier ? "Editar proveedor" : "Agregar proveedor"}</h3>
        <form onSubmit={submit}>
          <div className="mb-3">
            <label htmlFor="supplier-name" className="admin-form-label">Nombre</label>
            <input id="supplier-name" name="name" className={INPUT_CLASS} value={form.name} onChange={change} maxLength={100} required autoFocus />
          </div>
          {FIELDS.map((field) => (
            <div className="mb-3" key={field.name}>
              <label htmlFor={`supplier-${field.name}`} className="admin-form-label">{field.label}</label>
              <input
                id={`supplier-${field.name}`}
                name={field.name}
                type={field.type ?? "text"}
                className={INPUT_CLASS}
                value={form[field.name]}
                onChange={change}
                maxLength={field.maxLength}
                placeholder="Opcional"
              />
            </div>
          ))}
          <div className="mb-3">
            <label htmlFor="supplier-notes" className="admin-form-label">Notas</label>
            <textarea id="supplier-notes" name="notes" rows={2} className={INPUT_CLASS} value={form.notes} onChange={change} maxLength={500} placeholder="Opcional" />
          </div>
          {supplier && (
            <label className="store-check mb-3">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={change} />
              Activo
            </label>
          )}
          {error && <p className="text-danger small" role="alert">{error}</p>}
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary w-100" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-warning text-dark w-100" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SupplierFormModal;
