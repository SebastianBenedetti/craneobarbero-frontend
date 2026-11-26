import { apiRequest } from "./api";

export function uploadImage(blob, fileName = "foto.jpg") {
  const form = new FormData();
  form.append("file", blob, fileName);
  return apiRequest("/images", { method: "POST", body: form, fallbackError: "No se pudo subir la imagen" });
}
