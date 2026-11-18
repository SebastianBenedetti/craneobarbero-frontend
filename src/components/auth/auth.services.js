
const BASE_URL = import.meta.env.VITE_API_URL;

// Intenta extraer el mensaje de error del cuerpo JSON de la respuesta del servidor
// Si el body no es JSON válido o no tiene campo "error", usa el texto de fallback
const parseErrorMessage = async (res, fallback) => {
  try {
    const data = await res.json();
    return data.error || fallback;
  } catch (_) {
    return fallback;
  }
};

// Llama al endpoint de login con email y contraseña
// onSuccess recibe { token, user }, onError recibe un Error con el mensaje del servidor
export const loginService = (email, password, onSuccess, onError) => {
  fetch(`${BASE_URL}/auth/login`, {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify({ email, password })
  })
    .then(async (res) => {
      if (!res.ok) {
        // Si el servidor devuelve 4xx/5xx levantamos el error con el mensaje que mandó el backend
        const msg = await parseErrorMessage(res, "Credenciales incorrectas");
        throw new Error(msg);
      }
      return res.json();
    })
    .then(onSuccess)
    .catch(onError);
};

// Crea un nuevo usuario con rol CLIENT y devuelve el token JWT
// El usuario queda logueado automáticamente al registrarse sin necesidad de un segundo login
export const registerService = (name, email, password, onSuccess, onError) => {
  fetch(`${BASE_URL}/auth/register`, {
    headers: { "Content-Type": "application/json" },
    method: "POST",
    body: JSON.stringify({ name, email, password })
  })
    .then(async (res) => {
      if (!res.ok) {
        const msg = await parseErrorMessage(res, "Error al registrar");
        throw new Error(msg);
      }
      return res.json();
    })
    .then(onSuccess)
    .catch(onError);
};
