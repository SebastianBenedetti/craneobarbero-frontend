// Servicios de cuenta del usuario autenticado
// A diferencia de auth.services.js, estas rutas son protegidas: requieren el token JWT en cada petición
// El backend identifica al usuario a partir del token, no es necesario pasar el userId en la mayoría de los casos
const BASE_URL = import.meta.env.VITE_API_URL;

// Construye los headers necesarios para rutas protegidas del backend
// El backend valida este token en auth.middleware.js antes de procesar cualquier petición
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("barberia-token")}`,
});


// Cambia la contraseña del usuario autenticado
// Se necesita pasar userId explícitamente porque el endpoint es PUT /users/:id
export const changePasswordService = (userId, newPassword, onSuccess, onError) => {
  fetch(`${BASE_URL}/users/${userId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ password: newPassword }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al cambiar contraseña");
      }
      return res.json();
    })
    .then(onSuccess)
    .catch(onError);
};
