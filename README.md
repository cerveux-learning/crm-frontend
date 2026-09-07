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

## Despliegue en Vercel

El proyecto cuenta con la configuración oficial (`vercel.json` y `.env.production`) lista para desplegarse en Vercel con un solo clic:

### Opción 1: Desde la consola web de Vercel (Recomendada)

1. Sube los cambios a tu repositorio Git (GitHub / GitLab / Bitbucket).
2. En [vercel.com](https://vercel.com), selecciona **"Add New Project"** e importa este repositorio.
3. Vercel detectará automáticamente la configuración:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. *(Opcional)* En la sección **Environment Variables**, puedes configurar `VITE_API_URL` si deseas apuntar a un backend diferente (por defecto, `.env.production` ya apunta a `https://crm-backend-production-d6ed.up.railway.app/api`).
5. Haz clic en **Deploy**.

### Opción 2: Usando Vercel CLI

```bash
# Iniciar sesión y desplegar
npx vercel

# Para desplegar directamente a producción
npx vercel --prod
```

### Características de la configuración en Vercel:
- **Enrutamiento SPA**: Manejo de rutas sin errores 404 al recargar o navegar directamente.
- **Proxy `/api` inverso**: En caso de no definir variable de entorno en el cliente, las llamadas a `/api` son redirigidas de forma segura al backend de Railway.
- **Cabeceras de Seguridad y Caché**: Optimización de carga para los assets compilados (`Cache-Control`) y cabeceras de protección HTTP (X-Frame-Options, X-Content-Type-Options, etc.).

## Despliegue con Docker

Para construir y correr la imagen con Nginx:
```bash
docker build -t crm-frontend .
docker run -p 80:80 crm-frontend
```

