import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { backdropClose } from "../../utils/backdrop";

const FRAME_WIDTH = 320;
const MAX_ZOOM = 4;
const OUTPUT_LONG_SIDE = 900;
const MAX_UPLOAD_BYTES = 850_000;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function exportCrop(image, view, frame, aspect) {
  const outWidth = aspect >= 1 ? OUTPUT_LONG_SIDE : Math.round(OUTPUT_LONG_SIDE * aspect);
  const outHeight = Math.round(outWidth / aspect);
  const canvas = document.createElement("canvas");
  canvas.width = outWidth;
  canvas.height = outHeight;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#161616";
  ctx.fillRect(0, 0, outWidth, outHeight);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    -view.x / view.scale,
    -view.y / view.scale,
    frame.width / view.scale,
    frame.height / view.scale,
    0,
    0,
    outWidth,
    outHeight,
  );

  for (const quality of [0.86, 0.75, 0.62, 0.5]) {
    const webp = await canvasToBlob(canvas, "image/webp", quality);
    const blob = webp?.type === "image/webp" ? webp : await canvasToBlob(canvas, "image/jpeg", quality);
    if (blob && blob.size <= MAX_UPLOAD_BYTES) return blob;
  }
  throw new Error("La imagen es demasiado pesada. Probá con otra.");
}

function ImageCropModal({ src, aspect, title = "Ajustar la foto", onCancel, onConfirm }) {
  const [frameWidth] = useState(() => Math.min(FRAME_WIDTH, window.innerWidth - 88));
  const frame = { width: frameWidth, height: Math.round(frameWidth / aspect) };
  const imageRef = useRef(null);
  const dragRef = useRef(null);
  const [natural, setNatural] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const baseScale = natural ? Math.max(frame.width / natural.width, frame.height / natural.height) : 1;
  const scale = baseScale * zoom;
  const shown = natural ? { width: natural.width * scale, height: natural.height * scale } : { width: 0, height: 0 };

  const limit = (point, size = shown) => ({
    x: clamp(point.x, frame.width - size.width, 0),
    y: clamp(point.y, frame.height - size.height, 0),
  });

  const view = { ...limit(offset), scale };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const handleLoad = (e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
    const startScale = Math.max(frame.width / width, frame.height / height);
    setNatural({ width, height });
    setZoom(1);
    setOffset({ x: (frame.width - width * startScale) / 2, y: (frame.height - height * startScale) / 2 });
  };

  const changeZoom = (nextZoom) => {
    if (!natural) return;
    const next = clamp(nextZoom, 1, MAX_ZOOM);
    const nextScale = baseScale * next;
    const centerX = (frame.width / 2 - view.x) / scale;
    const centerY = (frame.height / 2 - view.y) / scale;
    const size = { width: natural.width * nextScale, height: natural.height * nextScale };
    setZoom(next);
    setOffset(limit({ x: frame.width / 2 - centerX * nextScale, y: frame.height / 2 - centerY * nextScale }, size));
  };

  const startDrag = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pointerX: e.clientX, pointerY: e.clientY, x: view.x, y: view.y };
  };

  const moveDrag = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    setOffset(limit({ x: drag.x + e.clientX - drag.pointerX, y: drag.y + e.clientY - drag.pointerY }));
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  const moveWithKeys = (e) => {
    const step = e.shiftKey ? 20 : 5;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      setOffset(limit({ x: view.x + moves[e.key][0], y: view.y + moves[e.key][1] }));
    } else if (e.key === "+" || e.key === "=") {
      changeZoom(zoom + 0.1);
    } else if (e.key === "-") {
      changeZoom(zoom - 0.1);
    }
  };

  const confirm = async () => {
    setSaving(true);
    setError("");
    try {
      const blob = await exportCrop(imageRef.current, view, frame, aspect);
      await onConfirm(blob);
    } catch (err) {
      setError(err.message || "No se pudo guardar la foto.");
      setSaving(false);
    }
  };

  return createPortal(
    <div className="modal-overlay image-crop-overlay" {...backdropClose(onCancel)}>
      <div className="modal-card image-crop-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-hint">Arrastrá la foto para moverla y usá el control para acercarla o alejarla. Lo que se ve en el recuadro es lo que se va a mostrar.</p>

        <div
          className="image-crop-frame"
          style={{ width: frame.width, height: frame.height }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onWheel={(e) => changeZoom(zoom - Math.sign(e.deltaY) * 0.1)}
          onKeyDown={moveWithKeys}
          tabIndex={0}
          aria-label="Encuadre de la foto: movela con las flechas y acercala con + y -"
        >
          <img
            ref={imageRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={handleLoad}
            onError={() => setError("No se pudo abrir la imagen. Probá con otro archivo.")}
            style={{ width: shown.width || undefined, height: shown.height || undefined, transform: `translate(${view.x}px, ${view.y}px)`, visibility: natural ? "visible" : "hidden" }}
          />
        </div>

        <label className="image-crop-zoom">
          <span>Alejar</span>
          <input
            type="range"
            min="1"
            max={MAX_ZOOM}
            step="0.01"
            value={zoom}
            onChange={(e) => changeZoom(Number(e.target.value))}
            aria-label="Acercar o alejar la foto"
            disabled={!natural}
          />
          <span>Acercar</span>
        </label>

        {error && <p className="text-danger small mb-2">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-warning text-dark fw-bold" onClick={confirm} disabled={!natural || saving}>
            {saving ? "Guardando…" : "Usar esta foto"}
          </button>
          <button type="button" className="modal-close" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ImageCropModal;
