import { fetchAllPages } from "../../services/pagedRequest";
const BASE_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("barberia-token")}`,
});
//este servicio es para obtener los turnos de un barbero, se hace una petición GET a la ruta /appointments y se pasan los headers de autenticación.
// Si la respuesta es correcta, se llama a la función onSuccess con los datos obtenidos, si no, se llama a la función onError con el error.
//la funcion succes y error son funciones que se pasan como parametros a la funcion getBarberAppointmentsService, y se ejecutan dependiendo del resultado de la petición.
export const getBarberAppointmentsService = (onSuccess, onError) => {
  fetchAllPages("/appointments", "Error al obtener turnos").then(onSuccess).catch(onError);
};
