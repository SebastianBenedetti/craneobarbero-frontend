import { useContext } from "react";
import { AuthContext } from "../context/auth";

// Hook personalizado para usar el contexto de auth en cualquier componente
// En vez de escribir useContext(AuthContext) cada vez, se usa useAuth()
// Ejemplo: const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
