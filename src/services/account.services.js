import { apiRequest } from "./api";

export const getMe = () => apiRequest("/me", { fallbackError: "No se pudieron cargar tus datos" });

export const updateMe = (profile) =>
  apiRequest("/me", { method: "PUT", body: profile, fallbackError: "No se pudieron guardar tus datos" });

export const changeMyPassword = (currentPassword, newPassword) =>
  apiRequest("/me/password", {
    method: "PUT",
    body: { currentPassword, newPassword },
    fallbackError: "No se pudo cambiar la contraseña",
  });

export const resendVerification = () =>
  apiRequest("/auth/resend-verification", { method: "POST", fallbackError: "No se pudo reenviar el mail" });

export const verifyEmail = (token) =>
  apiRequest("/auth/verify-email", { method: "POST", body: { token }, auth: false, fallbackError: "No se pudo verificar el email" });

export const forgotPassword = (email) =>
  apiRequest("/auth/forgot-password", { method: "POST", body: { email }, auth: false, fallbackError: "No se pudo enviar el mail" });

export const resetPassword = (token, password) =>
  apiRequest("/auth/reset-password", {
    method: "POST",
    body: { token, password },
    auth: false,
    fallbackError: "No se pudo cambiar la contraseña",
  });

export const getMyClosurePreview = () =>
  apiRequest("/me/closure-preview", { fallbackError: "No se pudieron revisar tus turnos" });

export const deactivateMyAccount = (password) =>
  apiRequest("/me/deactivate", { method: "POST", body: { password }, fallbackError: "No se pudo desactivar la cuenta" });

export const deleteMyAccount = (password) =>
  apiRequest("/me", { method: "DELETE", body: { password }, fallbackError: "No se pudo eliminar la cuenta" });

export const getMyClients = () => apiRequest("/clients/mine", { fallbackError: "No se pudieron cargar tus clientes" });
