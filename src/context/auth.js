import { createContext } from "react";

// Creamos el contexto de autenticación
// Esto nos permite compartir el usuario logueado en toda la app sin pasar props de padre a hijo
export const AuthContext = createContext(null);
