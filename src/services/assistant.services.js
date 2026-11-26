import { apiRequest } from "./api";

export const sendAssistantMessage = ({ conversationId, message, choice }) =>
  apiRequest("/assistant/message", {
    method: "POST",
    body: { conversationId: conversationId ?? null, message: message ?? null, choice: choice ?? null },
    fallbackError: "El asistente no pudo responder. Probá de nuevo en un momento.",
  });
