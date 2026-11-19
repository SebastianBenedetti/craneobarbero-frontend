# Cráneo Barbero — Frontend

Aplicación web de la barbería Cráneo Barbero: reserva de turnos, paneles de cliente, barbero y administrador.

Hecha con React y Vite. Se despliega en Vercel.

## Desarrollo local

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` a `.env` y completar `VITE_API_URL` con la URL del backend.
3. Levantar el servidor de desarrollo: `npm run dev`

En local, con la API corriendo en el puerto 5065, se usa `VITE_API_URL=http://localhost:5065`. El backend tiene que tener el origen del front (`http://localhost:5173`) en su `FRONTEND_URL`.

## Despliegue

Vercel compila la rama `main` con `npm run build`. La variable `VITE_API_URL` se carga en el panel del proyecto, con la URL pública de la API en Render y sin barra al final. `vercel.json` redirige todas las rutas a `index.html` para que funcione el enrutado del lado del cliente.
