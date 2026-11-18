import { createContext, useContext, useState, useEffect } from "react";

// Creamos el contexto de autenticación
// Esto nos permite compartir el usuario logueado en toda la app sin pasar props de padre a hijo
const AuthContext = createContext(null);

// Decodifica el payload del token JWT para obtener los datos del usuario (id, role, name, exp)
// El JWT tiene 3 partes separadas por puntos: header.payload.signature
// Solo necesitamos el payload (índice 1), que está codificado en Base64
// escape + decodeURIComponent resuelve problemas con caracteres especiales (acentos, ñ, etc.)
// sin esto los nombres con acentos se mostraban mal
function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(decodeURIComponent(escape(atob(payload)))); // atob decodifica Base64, escape + decodeURIComponent resuelve problemas con caracteres especiales
  } catch {
    return null; // si el token está roto o mal formado devolvemos null
  }
}

// Proveedor del contexto de auth, envuelve toda la app en App.jsx
// Cualquier componente dentro puede usar useAuth() para acceder al usuario logueado
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Al cargar la app verificamos si hay un token guardado en localStorage
  // Si existe y no venció, restauramos el usuario automáticamente (para no perder la sesión al refrescar)
  useEffect(() => {
    const token = localStorage.getItem("barberia-token");
    if (token) {
      const decoded = decodeToken(token);
      // exp está en segundos Unix, Date.now() en milisegundos, por eso multiplicamos por 1000
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      } else {
        // Si el token venció lo eliminamos del storage para forzar un nuevo login
        localStorage.removeItem("barberia-token");
      }
    }
  }, []);

  // Guarda el token en localStorage y actualiza el estado del usuario
  // Se llama desde Login.jsx y Register.jsx después de recibir el JWT del servidor
  const login = (token) => {
    localStorage.setItem("barberia-token", token);
    setUser(decodeToken(token));
  };

  // Borra el token y limpia el estado: el usuario queda deslogueado
  const logout = () => {
    localStorage.removeItem("barberia-token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para usar el contexto de auth en cualquier componente
// En vez de escribir useContext(AuthContext) cada vez, se usa useAuth()
// Ejemplo: const { user, login, logout } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}
