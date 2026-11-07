# Aforo

Frontend del Sistema de Gestión de Eventos: cartelera, inscripciones y administración de eventos, asistentes y ubicaciones. Hecho con React 18, TypeScript, Vite, Tailwind y shadcn/ui.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Para usar la API real: el backend `sistema-gestion-de-eventos` (ramas `dev` y `feature/inscripciones`), con Docker o con Java 21

```bash
npm install
cp .env.example .env
```

## Arrancar

### Con la API real (por defecto)

```bash
npm run dev
```

La app abre en `http://localhost:5173` y Vite reenvía `/api` a `VITE_PROXY_TARGET`. Si la API está apagada, aparece la pantalla `No se puede conectar con la API`, con su explicación.

Si el backend corre con el Docker Compose de su repositorio, entra por nginx en el puerto 80. Pon esto en `.env`:

```env
VITE_PROXY_TARGET=http://localhost
```

### Con datos de ejemplo (sin backend)

```env
VITE_USE_MOCKS=true
```

Reinicia `npm run dev`. Los datos son sintéticos y viven en la pestaña: una barra inferior avisa de que estás en este modo.

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Administración | `admin@aforo.test` | `admin1234` |
| Visitante | `visitante@aforo.test` | `visitante1234` |

La barra incluye **Simular error**, que hace fallar la siguiente inscripción para ver los casos que la interfaz normalmente evita: evento no disponible, ya inscrito, evento lleno, choque de horario y error del servidor. El código del mock no entra en el build de producción; solo se copia `mockServiceWorker.js`, que queda sin registrar.

## Usuarios en la API real

- **Visitantes:** se crean con `POST /api/auth/registro`, enviando `nombre`, `email` y `password` (mínimo 8 caracteres). La app no tiene pantalla de registro.
- **Administrador inicial:** se define con las variables `ADMIN_EMAIL` y `ADMIN_PASSWORD` del backend antes de arrancarlo.

## Variables de entorno

| Variable | Valor por defecto | Para qué sirve |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | Prefijo de todas las peticiones |
| `VITE_PROXY_TARGET` | `http://localhost:8080` | Adónde reenvía Vite `/api` en desarrollo |
| `VITE_USE_MOCKS` | `false` | Con `true`, usa los datos de ejemplo |

## Rutas

| Ruta | Quién entra | Qué hace |
| --- | --- | --- |
| `/login` | Todos | Inicio de sesión |
| `/eventos` | Sesión iniciada | Cartelera con búsqueda y filtros |
| `/eventos/:id` | Sesión iniciada | Detalle, inscripción o acceso a asistentes |
| `/mis-inscripciones` | Visitante | Inscripciones activas y canceladas |
| `/admin/eventos` | Administración | Crear, editar y cancelar eventos |
| `/admin/eventos/:id/asistentes` | Administración | Agregar y retirar asistentes |
| `/admin/ubicaciones` | Administración | Crear, editar, desactivar y reactivar ubicaciones |

## Cambiar endpoints

Todas las URL de la API están en `src/services`, un archivo por recurso, y pasan por `src/lib/api.ts`, que añade la cookie de sesión y el token CSRF. Si cambia un endpoint, edita solo su servicio. Los tipos de las respuestas están en `src/types/index.ts`.

## Comandos

```bash
npm test         # pruebas
npm run lint     # ESLint
npm run build    # TypeScript y build de producción
```

## Limitaciones actuales

El frontend sigue el contrato real del backend, que todavía difiere de la especificación original. Hasta que se complete la Fase 2 en el backend:

- Agregar y retirar asistentes (`POST` y `DELETE /eventos/{id}/inscritos`) no existe en la API real. Las acciones siguen visibles y muestran el error recibido.
- `/usuarios` y las inscripciones dependen de ramas que aún no están unidas en `main`.
- `POST /inscripciones` y `GET /inscripciones/mias` probablemente fallen con un 500 por cómo se serializan las entidades. Es una deducción de leer el código, sin comprobar contra la API en marcha.
- La API no envía `message` en sus errores por defecto, así que la app usa textos propios según el código de estado.

En modo mock todas estas funciones están disponibles. La app solo se ha probado contra el mock, no contra la API real.
