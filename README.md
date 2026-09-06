# CRM Frontend Client

Aplicación Single Page Application (SPA) para la gestión integral del CRM, construida con React 19, TypeScript, Vite, Tailwind CSS y Lucide Icons.

## Requisitos previos

- Node.js >= 20
- Backend del CRM en ejecución (por defecto en `http://localhost:4000`)

## Instalación y Configuración

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Configurar variables de entorno (opcional):
   ```bash
   cp .env.example .env
   ```
   *Nota: Por defecto en desarrollo, Vite reenvía las peticiones de `/api` a `http://localhost:4000` sin necesidad de configurar `VITE_API_URL`.*

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   La aplicación estará disponible en `http://localhost:5173`.

## Scripts disponibles

- `npm run dev`: Inicia el servidor de desarrollo de Vite con HMR.
- `npm run build`: Valida tipos con `tsc` y compila los assets para producción en `dist/`.
- `npm run preview`: Previsualiza localmente el build de producción.

## Despliegue con Docker

Para construir y correr la imagen con Nginx:
```bash
docker build -t crm-frontend .
docker run -p 80:80 crm-frontend
```
