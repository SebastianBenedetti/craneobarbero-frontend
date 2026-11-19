// servicios que usa el panel del admin para todas las operaciones de gestiÃ³n
const BASE_URL = import.meta.env.VITE_API_URL;

// siempre mandamos el token del admin en el header
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("barberia-token")}`,
});

// ===== USUARIOS =====

// trae todos los usuarios (clientes y barberos mezclados, filtramos en el frontend)
export const getAllUsersService = (onSuccess, onError) => {
  fetch(`${BASE_URL}/users`, {
    headers: authHeaders(),
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al obtener usuarios");
      }
      return res.json();
    })
    .then(onSuccess)
    .catch(onError);
};

// crea un usuario nuevo desde el panel admin, el rol viene en el body
export const createUserAdminService = (userData, onSuccess, onError) => {
  fetch(`${BASE_URL}/users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(userData),
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear usuario");
      }
      return res.json();
    })
    .then(onSuccess)
    .catch(onError);
};

// actualiza los datos de un usuario, no mandamos el mail porque no se puede cambiar
export const updateUserAdminService = (userId, userData, onSuccess, onError) => {
  fetch(`${BASE_URL}/users/${userId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(userData),
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar usuario");
      }
      return res.json();
    })
    .then(onSuccess)
    .catch(onError);
};

// elimina un usuario por id
export const deleteUserAdminService = (userId, onSuccess, onError) => {
  fetch(`${BASE_URL}/users/${userId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar usuario");
      }
      return res.json();
    })
    .then(onSuccess)
    .catch(onError);
};

const catalogRequest = (path, method, body, fallbackError, onSuccess, onError) => {
  fetch(`${BASE_URL}${path}`, {
    method,
    headers: authHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  })
    .then(async (res) => {
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || fallbackError);
      }
      return data;
    })
    .then(onSuccess)
    .catch(onError);
};

// ===== BARBEROS =====

export const getAllBarbersAdminService = (onSuccess, onError) =>
  catalogRequest("/barbers?includeInactive=true", "GET", undefined, "Error al obtener barberos", onSuccess, onError);

export const createBarberAdminService = (barberData, onSuccess, onError) =>
  catalogRequest("/barbers", "POST", barberData, "Error al crear barbero", onSuccess, onError);

export const updateBarberAdminService = (barberId, barberData, onSuccess, onError) =>
  catalogRequest(`/barbers/${barberId}`, "PUT", barberData, "Error al actualizar barbero", onSuccess, onError);

export const setBarberActiveAdminService = (barberId, active, onSuccess, onError) =>
  catalogRequest(
    `/barbers/${barberId}/${active ? "activate" : "deactivate"}`,
    "POST",
    undefined,
    active ? "Error al reactivar barbero" : "Error al desactivar barbero",
    onSuccess,
    onError,
  );

// ===== SUCURSALES =====

export const getAllBranchesAdminService = (onSuccess, onError) =>
  catalogRequest("/branches?includeInactive=true", "GET", undefined, "Error al obtener sucursales", onSuccess, onError);

export const createBranchAdminService = (branchData, onSuccess, onError) =>
  catalogRequest("/branches", "POST", branchData, "Error al crear sucursal", onSuccess, onError);

export const updateBranchAdminService = (branchId, branchData, onSuccess, onError) =>
  catalogRequest(`/branches/${branchId}`, "PUT", branchData, "Error al actualizar sucursal", onSuccess, onError);

export const setBranchActiveAdminService = (branchId, active, onSuccess, onError) =>
  catalogRequest(
    `/branches/${branchId}/${active ? "activate" : "deactivate"}`,
    "POST",
    undefined,
    active ? "Error al reactivar sucursal" : "Error al desactivar sucursal",
    onSuccess,
    onError,
  );

// ===== SERVICIOS (cortes) =====

export const getAllCutsAdminService = (onSuccess, onError) =>
  catalogRequest("/cuts?includeInactive=true", "GET", undefined, "Error al obtener servicios", onSuccess, onError);

export const createCutAdminService = (cutData, onSuccess, onError) =>
  catalogRequest("/cuts", "POST", cutData, "Error al crear servicio", onSuccess, onError);

export const updateCutAdminService = (cutId, cutData, onSuccess, onError) =>
  catalogRequest(`/cuts/${cutId}`, "PUT", cutData, "Error al actualizar servicio", onSuccess, onError);

export const setCutActiveAdminService = (cutId, active, onSuccess, onError) =>
  catalogRequest(
    `/cuts/${cutId}/${active ? "activate" : "deactivate"}`,
    "POST",
    undefined,
    active ? "Error al reactivar servicio" : "Error al desactivar servicio",
    onSuccess,
    onError,
  );

// ===== TURNOS =====

// trae todos los turnos (el admin ve todos sin filtrar)
export const getAllAppointmentsAdminService = (onSuccess, onError) => {
  fetch(`${BASE_URL}/appointments`, {
    headers: authHeaders(),
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al obtener turnos");
      }
      return res.json();
    })
    .then(onSuccess)
    .catch(onError);
};

// crea un turno desde el panel admin
export const createAppointmentAdminService = (appointmentData, onSuccess, onError) => {
  fetch(`${BASE_URL}/appointments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(appointmentData),
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear turno");
      }
      return res.json();
    })
    .then(onSuccess)
    .catch(onError);
};

// elimina un turno por id
export const deleteAppointmentAdminService = (appointmentId, onSuccess, onError) => {
  fetch(`${BASE_URL}/appointments/${appointmentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
    .then(async (res) => {
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al eliminar turno");
      }
      return res.json();
    })
    .then(onSuccess)
    .catch(onError);
};