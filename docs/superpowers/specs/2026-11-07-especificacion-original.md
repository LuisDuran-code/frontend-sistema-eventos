# Especificación original del usuario

Copia literal del pedido. Ver las decisiones en `2026-11-07-aforo-frontend-design.md`.

Crea el frontend web de un "Sistema de Gestión de Eventos". Va en un repositorio separado y consume una API REST ya existente, hecha con Spring Boot 3.5 y PostgreSQL.

## Stack obligatorio
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui para todos los componentes de interfaz (Button, Card, Table, Dialog, AlertDialog, Form, Input, Textarea, Select, Calendar, Popover, Badge, Tabs, DropdownMenu, Sheet, Skeleton, Sonner para toasts)
- React Router v6 para las rutas
- TanStack Query para las peticiones, la caché y la invalidación
- react-hook-form + zod para formularios y validación
- date-fns con locale es para las fechas
- lucide-react para los íconos
- Toda la interfaz en español

## Autenticación
- La API usa sesión con cookie (no JWT). Todas las peticiones deben ir con `credentials: "include"`.
- URL base de la API en la variable de entorno `VITE_API_URL`.
- Crea un cliente HTTP único en `src/lib/api.ts` que:
  - adjunte las credenciales,
  - convierta los errores en un tipo `ApiError { status, message }`,
  - redirija a /login cuando reciba un 401.
- Hay dos roles: ADMIN y VISITANTE (usuario normal).
- Al iniciar la app, consulta la sesión actual (GET /auth/me) y guarda el usuario y su rol en un AuthContext.
- Protege las rutas por rol con un componente `<RequireRole role="ADMIN">`.

## Endpoints (centralízalos en src/services/* para poder ajustarlos fácilmente)
- POST /auth/login { correo, contrasena } · POST /auth/logout · GET /auth/me
- GET /eventos · GET /eventos/{id} · POST /eventos · PUT /eventos/{id} · DELETE /eventos/{id}
- GET /eventos/{id}/inscritos · POST /eventos/{id}/inscritos { usuarioId } · DELETE /eventos/{id}/inscritos/{usuarioId}
- POST /inscripciones { eventoId } · GET /inscripciones/mias · PATCH /inscripciones/{id}/cancelar
- GET /ubicaciones · GET /ubicaciones/{id} · POST /ubicaciones · PUT /ubicaciones/{id} · DELETE /ubicaciones/{id}
- GET /usuarios (solo admin, para elegir a quién inscribir)

## Modelos (tipos TypeScript en src/types)
- Usuario: id, nombre, correo, rol, activo
- Ubicacion: id, nombre, direccion, capacidadMaxima, activa, imagenUrl
- Evento: id, titulo, descripcion, fechaInicio, fechaFin, limiteCupos, cuposDisponibles, ubicacion, imagenUrl
- Inscripcion: id, evento, usuario, estado ("ACTIVA" | "CANCELADA"), fechaRegistro
- Las imágenes son URLs externas: muéstralas con <img> y un placeholder si fallan. No hay subida de archivos; el formulario solo pide la URL.

## Casos de uso que debe cubrir la interfaz

CU01 – Iniciar sesión (ambos roles)
Página /login con un Card centrado y formulario de correo y contraseña (zod: correo válido, contraseña requerida). Si las credenciales son incorrectas, muestra el error en el formulario. Si el login es correcto, redirige según el rol: ADMIN → /admin/eventos, VISITANTE → /eventos.

CU02 – Consultar eventos (ambos roles)
- /eventos: grid de Cards con imagen, título, fechas, ubicación y un Badge de cupos disponibles (verde si hay, rojo "Lleno" si no). Incluye buscador por título y filtro por ubicación y por rango de fechas. Usa Skeleton mientras carga.
- /eventos/:id: detalle completo con la ubicación y su capacidad, una barra de cupos (ocupados/límite) y el botón de inscripción.

CU03 – Inscribirse (VISITANTE)
Botón "Inscribirme" en el detalle, con confirmación en un AlertDialog. El frontend debe deshabilitar el botón y explicar el motivo cuando:
- el evento no tiene cupos,
- el usuario ya está inscrito (inscripción ACTIVA),
- el evento ya terminó.
El backend es la fuente de verdad. Muestra un toast con el mensaje según su código de respuesta:
- 404 "El evento no está disponible"
- 409 por duplicado "Ya estás inscrito en este evento"
- 409 por cupos "El evento está lleno"
- 409 por capacidad "Se superó la capacidad de la ubicación"
- 409 por horario "Tienes otro evento en el mismo horario"
Si la respuesta trae un mensaje, úsalo en lugar del texto genérico. Al terminar con éxito, invalida las queries de eventos y de mis inscripciones.

CU04 – Cancelar asistencia (VISITANTE)
Página /mis-inscripciones con un Tabs ("Activas" / "Canceladas") y una Table con evento, fechas, ubicación y estado (Badge). Las inscripciones ACTIVAS tienen el botón "Cancelar asistencia", con un AlertDialog de confirmación, que llama a PATCH /inscripciones/{id}/cancelar.

CU05 – CRUD de eventos (ADMIN)
- /admin/eventos: Table con búsqueda, columnas (título, fechas, ubicación, cupos usados/límite) y acciones en un DropdownMenu (ver, editar, gestionar asistentes, eliminar con AlertDialog).
- El formulario de crear/editar va en un Dialog o Sheet: título, descripción, imagenUrl, ubicación (Select solo con ubicaciones activas), fecha y hora de inicio, fecha y hora de fin (Calendar + input de hora) y límite de cupos.
- Validaciones zod:
  - fechaFin posterior a fechaInicio,
  - fechaInicio no en el pasado al crear,
  - límite de cupos entero > 0 y ≤ capacidadMaxima de la ubicación elegida (muestra la capacidad junto al campo).
- Los errores 409 del backend (choque de ubicación en el mismo horario, capacidad) se muestran en el formulario.

CU06 – Gestionar asistentes (ADMIN)
- /admin/eventos/:id/asistentes: encabezado con datos del evento y cupos, y una Table de inscritos (nombre, correo, fecha de registro, estado).
- Botón "Agregar asistente": abre un Dialog con un Combobox (Command de shadcn) para buscar usuarios.
- Al agregar se aplican las mismas validaciones y mensajes de error que en CU03.
- La acción "Retirar" de cada fila cancela la inscripción, con confirmación previa.

CU07 – CRUD de ubicaciones (ADMIN)
- /admin/ubicaciones: Table con nombre, dirección, capacidad máxima, estado activo (Badge) y número de eventos asociados.
- Formulario en un Dialog: nombre, dirección, capacidadMaxima (entero > 0), imagenUrl y un Switch de activa.
- Reglas en la interfaz:
  - al editar, avisa si la nueva capacidad es menor que el límite de cupos de algún evento existente; el backend responde 409 y se muestra el mensaje,
  - si la ubicación tiene eventos asociados, no permite eliminarla: el botón queda deshabilitado con un Tooltip que lo explica, o se muestra el 409 del backend.

## Layout y diseño
- Layout con navbar superior: logo/nombre, enlaces según el rol y un menú de usuario (DropdownMenu con nombre, rol y "Cerrar sesión").
- En /admin, sidebar con Eventos y Ubicaciones; en móvil se convierte en Sheet.
- Responsive (móvil primero) y modo oscuro con un toggle (ThemeProvider de shadcn).
- Estados vacíos con ícono y texto ("Aún no hay eventos"), estados de carga con Skeleton y estados de error con botón "Reintentar".
- Formatea fechas como "sáb 8 nov 2026, 14:00".

## Estructura sugerida
src/
  components/ui/        (shadcn)
  components/           (EventCard, CuposBadge, ConfirmDialog, EventoForm, UbicacionForm, etc.)
  features/auth | eventos | inscripciones | ubicaciones | asistentes
  services/             (llamadas a la API por recurso)
  hooks/                (useEventos, useInscribirse, ... con TanStack Query)
  lib/api.ts, lib/utils.ts
  routes/               (definición de rutas y guards)
  types/

## Entregables
- Proyecto que arranque con `npm install && npm run dev`.
- Archivo `.env.example` con VITE_API_URL=http://localhost:8080/api
- README con instrucciones, la lista de rutas y cómo cambiar los endpoints.
- Opcional: modo mock con MSW (activado con VITE_USE_MOCKS=true) y datos de ejemplo, para desarrollar sin backend.
