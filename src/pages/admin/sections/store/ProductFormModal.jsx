import { useState } from "react";
import { createProduct, updateProduct } from "../../../../services/store.services";
import { backdropClose } from "../../../../utils/backdrop";
import { formatMoney } from "../../../../utils/format";
import { INPUT_CLASS, SELECT_CLASS, textOrNull, toNumberOrNull } from "./shared";
import ImageField from "../../../../components/ImageField/ImageField";

const fromProduct = (p) => ({
  categoryId: p?.categoryId ?? "",
  name: p?.name ?? "",
  description: p?.description ?? "",
  sku: p?.sku ?? "",
  barcode: p?.barcode ?? "",
  salePrice: p?.salePrice ?? "",
  cost: p?.cost ?? "",
  minStock: p?.minStock ?? 0,
  reorderQuantity: p?.reorderQuantity ?? "",
  defaultSupplierId: p?.defaultSupplier?.id ?? "",
  imageUrl: p?.imageUrl ?? "",
  isActive: p?.isActive ?? true,
});

function ProductFormModal({ product, categories, suppliers, onClose, onSaved }) {
  const [form, setForm] = useState(() => fromProduct(product));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const price = Number(form.salePrice);
  const cost = Number(form.cost);
  const showMargin = form.salePrice !== "" && form.cost !== "" && price > 0;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      categoryId: toNumberOrNull(form.categoryId),
      name: form.name.trim(),
      description: textOrNull(form.description),
      sku: textOrNull(form.sku),
      barcode: textOrNull(form.barcode),
      salePrice: toNumberOrNull(form.salePrice),
      cost: toNumberOrNull(form.cost),
      minStock: toNumberOrNull(form.minStock),
      reorderQuantity: toNumberOrNull(form.reorderQuantity),
      defaultSupplierId: toNumberOrNull(form.defaultSupplierId),
      imageUrl: textOrNull(form.imageUrl),
      isActive: form.isActive,
    };
    try {
      if (product) await updateProduct(product.id, body);
      else await createProduct(body);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const activeSuppliers = suppliers.filter((s) => s.isActive || s.id === Number(form.defaultSupplierId));

  return (
    <div className="admin-modal-overlay" {...backdropClose(onClose)}>
      <div className="admin-modal store-modal-wide" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
        <h3 id="product-form-title" className="admin-modal-title">{product ? "Editar producto" : "Agregar producto"}</h3>
        <form onSubmit={submit}>
          <div className="store-form-grid">
            <div className="store-form-full">
              <label htmlFor="product-name" className="admin-form-label">Nombre</label>
              <input id="product-name" name="name" className={INPUT_CLASS} value={form.name} onChange={change} maxLength={100} required />
            </div>
            <div>
              <label htmlFor="product-category" className="admin-form-label">Categoría</label>
              <select id="product-category" name="categoryId" className={SELECT_CLASS} value={form.categoryId} onChange={change} required>
                <option value="">Elegí una categoría</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="product-supplier" className="admin-form-label">Proveedor habitual</label>
              <select id="product-supplier" name="defaultSupplierId" className={SELECT_CLASS} value={form.defaultSupplierId} onChange={change}>
                <option value="">Sin proveedor</option>
                {activeSuppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="product-price" className="admin-form-label">Precio de venta</label>
              <input id="product-price" name="salePrice" type="number" min="0" step="0.01" className={INPUT_CLASS} value={form.salePrice} onChange={change} required />
            </div>
            <div>
              <label htmlFor="product-cost" className="admin-form-label">Costo</label>
              <input id="product-cost" name="cost" type="number" min="0" step="0.01" className={INPUT_CLASS} value={form.cost} onChange={change} placeholder="Se actualiza con cada compra" />
            </div>
            {showMargin && (
              <p className="admin-form-hint store-form-full">
                Margen: {formatMoney(price - cost)} ({(((price - cost) / price) * 100).toFixed(1)}%)
              </p>
            )}
            <div>
              <label htmlFor="product-min" className="admin-form-label">Stock mínimo</label>
              <input id="product-min" name="minStock" type="number" min="0" step="1" className={INPUT_CLASS} value={form.minStock} onChange={change} required />
            </div>
            <div>
              <label htmlFor="product-reorder" className="admin-form-label">Cantidad a reponer</label>
              <input id="product-reorder" name="reorderQuantity" type="number" min="1" step="1" className={INPUT_CLASS} value={form.reorderQuantity} onChange={change} placeholder="Opcional" />
            </div>
            <div>
              <label htmlFor="product-sku" className="admin-form-label">SKU</label>
              <input id="product-sku" name="sku" className={INPUT_CLASS} value={form.sku} onChange={change} maxLength={50} placeholder="Opcional" />
            </div>
            <div>
              <label htmlFor="product-barcode" className="admin-form-label">Código de barras</label>
              <input id="product-barcode" name="barcode" className={INPUT_CLASS} value={form.barcode} onChange={change} maxLength={50} placeholder="Opcional" />
            </div>
            <div className="store-form-full">
              <label htmlFor="product-description" className="admin-form-label">Descripción</label>
              <textarea id="product-description" name="description" rows={2} className={INPUT_CLASS} value={form.description} onChange={change} maxLength={500} placeholder="Opcional" />
            </div>
            <div className="store-form-full">
              <ImageField id="product-image" label="Imagen" value={form.imageUrl} onChange={change} aspect={4 / 3} labelClassName="admin-form-label" inputClassName={INPUT_CLASS} />
            </div>
            <label className="store-check store-form-full">
              <input type="checkbox" name="isActive" checked={form.isActive} onChange={change} />
              Activo (se muestra en la tienda)
            </label>
          </div>

          {!product && <p className="admin-form-hint">El producto nace con stock 0: el stock se carga registrando una compra.</p>}
          {error && <p className="text-danger mb-3 small" role="alert">{error}</p>}

          <div className="d-flex gap-2 mt-3">
            <button type="button" className="btn btn-outline-secondary w-100" onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-warning text-dark w-100" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductFormModal;
