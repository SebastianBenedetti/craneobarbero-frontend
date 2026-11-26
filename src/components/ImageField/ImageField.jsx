import "../../styles/imageField.css";
import { useEffect, useRef, useState } from "react";
import ImageCropModal from "./ImageCropModal";
import { uploadImage } from "../../services/images.services";
import { IMAGE_URL_HINT, IMAGE_URL_PATTERN } from "../../utils/image";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

function ImageField({ id, name = "imageUrl", label = "Foto", value, onChange, aspect = 1, inputClassName = "form-control", labelClassName = "form-label text-light" }) {
  const fileRef = useRef(null);
  const [cropSource, setCropSource] = useState(null);
  const [error, setError] = useState("");
  const [loadingAdjust, setLoadingAdjust] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [lastValue, setLastValue] = useState(value);

  if (lastValue !== value) {
    setLastValue(value);
    setPreviewFailed(false);
  }

  useEffect(() => () => {
    if (cropSource) URL.revokeObjectURL(cropSource);
  }, [cropSource]);

  const emit = (url) => onChange({ target: { name, value: url } });

  const openFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("La foto tiene que ser JPG, PNG o WebP.");
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      setError("La foto pesa demasiado (más de 15 MB).");
      return;
    }
    setError("");
    setCropSource(URL.createObjectURL(file));
  };

  const adjustCurrent = async () => {
    setError("");
    setLoadingAdjust(true);
    try {
      const response = await fetch(new URL(value, window.location.origin), { mode: "cors", cache: "reload" });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) throw new Error();
      setCropSource(URL.createObjectURL(blob));
    } catch {
      setError("No se pudo abrir esta foto para ajustarla. Subí el archivo de nuevo.");
    } finally {
      setLoadingAdjust(false);
    }
  };

  const save = async (blob) => {
    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    const uploaded = await uploadImage(blob, `foto.${extension}`);
    emit(uploaded.url);
    setCropSource(null);
  };

  return (
    <div className="image-field mb-3">
      <label className={labelClassName} htmlFor={id}>{label}</label>
      <div className="image-field-row">
        <div className="image-field-preview" style={{ aspectRatio: aspect }}>
          {value && !previewFailed ? (
            <img src={value} alt="Vista previa" onError={() => setPreviewFailed(true)} />
          ) : (
            <span aria-hidden="true">{value ? "Sin vista previa" : "Sin foto"}</span>
          )}
        </div>
        <div className="image-field-actions">
          <button type="button" className="btn btn-warning btn-sm text-dark fw-bold" onClick={() => fileRef.current?.click()}>
            Subir foto
          </button>
          {value && (
            <button type="button" className="btn btn-outline-warning btn-sm" onClick={adjustCurrent} disabled={loadingAdjust}>
              {loadingAdjust ? "Abriendo…" : "Ajustar encuadre"}
            </button>
          )}
          {value && (
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => emit("")}>
              Quitar foto
            </button>
          )}
          <input ref={fileRef} type="file" accept={ACCEPTED.join(",")} onChange={openFile} hidden />
        </div>
      </div>
      {error && <p className="text-danger small mt-2 mb-0">{error}</p>}
      <details className="image-field-url mt-2">
        <summary>O pegá una dirección web</summary>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="url"
          pattern={IMAGE_URL_PATTERN}
          title={IMAGE_URL_HINT}
          className={`${inputClassName} mt-2`}
          value={value}
          onChange={onChange}
          maxLength={500}
          placeholder="https://…"
        />
      </details>
      {cropSource && (
        <ImageCropModal src={cropSource} aspect={aspect} title="Ajustar la foto" onCancel={() => setCropSource(null)} onConfirm={save} />
      )}
    </div>
  );
}

export default ImageField;
