# Aforo: frontend del Sistema de Gestión de Eventos

Fecha: 2026-11-07. Estado: pendiente de aprobación.

## Intención

Frontend web para una tarea académica. Consume la API de `../backend/sistema-gestion-de-eventos` (Spring Boot 3.5 y PostgreSQL) y debe demostrar los casos de uso CU01 a CU07 de principio a fin, incluidos errores y reglas de negocio.

La especificación funcional está en `2026-11-07-especificacion-original.md`. **Por decisión del usuario, donde esa especificación y el backend difieren, manda el backend.** Las pantallas, los casos de uso y el stack se mantienen; este documento fija las diferencias.

La referencia del backend es la rama `dev` más `feature/inscripciones`, leídas el 2026-11-07. `main` solo tiene entidades. El backend no se ejecutó durante este análisis.

## Objetivos

- Cubrir CU01 a CU07 con todas las rutas, validaciones y mensajes aplicables.
- Arrancar con `npm install && npm run dev`.
- Funcionar con la API real y con `VITE_USE_MOCKS=true`.
- Toda la interfaz en español, responsive desde móvil y con modo oscuro.
- Estados de carga, vacío y error en cada vista de datos.

## No objetivos

Subida de archivos, registro de usuarios en la interfaz, recuperación de contraseña, pagos, notificaciones, internacionalización y despliegue.

## Antiobjetivos

Sería un fracaso aunque funcione técnicamente si:

- un botón aparece deshabilitado sin explicar el motivo;
- la interfaz contradice una respuesta del backend;
- un error del backend se pierde o queda como texto técnico;
- se muestran datos de ejemplo sin aclarar que son sintéticos;
- el mock responde con formas distintas a las de la API real.

## Decisiones del usuario

- Contexto: tarea académica. Eventos: mezcla general.
- Dirección visual: **Mesa de registro con sellos**.
- Manda el backend real.
- Los cambios necesarios en el backend los hace Claude, en otra rama, después del frontend (ver Fase 2).
- Los errores que la interfaz previene se demuestran con un panel **Simular error**, solo en modo mock.
- Por defecto la app espera la API real; si no responde, explica cómo activar el mock.
- Proceso: documento de diseño y plan antes de escribir código.

## Dirección visual

Contrato en `.impeccable/surfaces/src-routes-index-tsx.md`. Boceto: `.impeccable/mocks/decision/sellos.html`.

- Navegación, tablas, formularios y diálogos son los componentes estándar de shadcn. El mundo visual solo aporta tipografía, paleta, densidad y un gesto.
- Paleta: barra índigo `#27348B`, fondo `#EEF1FA`, tinta `#171B33`, rojo sello `#C8102E`, verde `#0B7A53`. El modo oscuro deriva de esos tonos con tokens de shadcn.
- Tipografía: Figtree en toda la interfaz. Barlow Condensed solo dentro de los sellos. Cifras tabulares.
- Gesto propio: componente `Sello`, variante de Badge para `Inscrito`, `Lleno`, `Finalizado`, `Cancelado` y `Cancelada`.
- El verde se reserva para lo que es del usuario. La excepción es el Badge de cupos disponibles que pide CU02.
- Al confirmar una inscripción, el sello `Inscrito` cae en 200 ms y los cupos cambian en su sitio. Con `prefers-reduced-motion` aparece sin movimiento.
- En el detalle domina una sola acción: Inscribirme.

## Arquitectura

- `src/lib/api.ts`: cliente único. Base `VITE_API_URL`, por defecto `/api`. Envía `credentials: "include"` y, en POST, PUT, PATCH y DELETE, la cabecera `X-XSRF-TOKEN` leída de la cookie `XSRF-TOKEN`. Lanza `ApiError { status, message }`.
- Un 401 redirige a `/login`, salvo en `POST /auth/login` (error en el formulario) y `GET /auth/me` (significa "sin sesión").
- `src/services/*`: una función por endpoint. Tipos con los nombres del backend en `src/types`. No hay capa de traducción de nombres.
- `src/hooks/*`: queries y mutations de TanStack Query con claves centralizadas.
- `src/features/*`: páginas y componentes por dominio. `src/routes/*`: rutas y guards.
- `AuthContext` consulta `GET /auth/me` al arrancar y no redirige hasta tener respuesta.

## Conexión con la API

- La API no tiene CORS. Vite usa un proxy de `/api` hacia `VITE_PROXY_TARGET`, por defecto `http://localhost:8080`. Así el navegador ve un solo origen y funcionan la cookie de sesión y la de CSRF.
- Esto cambia la especificación: `.env.example` lleva `VITE_API_URL=/api`, no `http://localhost:8080/api`. También incluye `VITE_PROXY_TARGET` y `VITE_USE_MOCKS=false`.
- Con Docker Compose la app solo se expone por nginx, así que el objetivo es `http://localhost`. El README lo explica.
- Sin archivo `.env` los valores por defecto bastan para arrancar.
- Si la API no responde, una pantalla "No se puede conectar con la API" ofrece Reintentar y explica cómo activar el modo mock. Solo aparece ante fallo de red o error de pasarela, nunca ante un 401.

## Contrato real

Base `/api`. Las listas devuelven una página de Spring (`content`, `totalElements`, `totalPages`, `number`, `size`), con un máximo de 50 por página.

| Recurso | Endpoint | Notas |
|---|---|---|
| Sesión | `POST /auth/login { email, password }` | Devuelve `{ id, nombre, email, rol }`; 401 si falla |
| | `GET /auth/me` | Hoy `{ email, roles: ["ROLE_ADMIN"] }`; ver Fase 2 |
| | `POST /auth/logout` | Exige CSRF; responde sin cuerpo |
| Eventos | `GET /eventos?nombre&desde&hasta&ubicacionId&page&size&sort` | El ADMIN también recibe cancelados |
| | `GET /eventos/{id}`, `POST`, `PUT /eventos/{id}` | `{ nombre, descripcion, fecha, horaInicio, horaFin, cupo, ubicacionId }` |
| | `DELETE /eventos/{id}` | **Cancela** el evento y sus inscripciones |
| | `GET /eventos/{id}/inscritos` | Página de `{ usuarioId, nombre, email, fechaInscripcion }`, solo confirmados |
| Asistentes | `POST /eventos/{id}/inscritos { usuarioId }`, `DELETE /eventos/{id}/inscritos/{usuarioId}` | **No existen aún**; Fase 2 |
| Inscripciones | `POST /inscripciones { eventoId }` | Rama sin fusionar |
| | `GET /inscripciones/mias?estado=` | Rama sin fusionar |
| | `DELETE /inscripciones/{id}` | Cancela; rama sin fusionar |
| Ubicaciones | `GET /ubicaciones?nombre&page&size`, `GET /{id}`, `POST`, `PUT /{id}` | `{ nombre, descripcion, direccion, capacidad, imagenPrincipal, imagenes }` |
| | `DELETE /ubicaciones/{id}`, `PATCH /ubicaciones/{id}/reactivar` | Desactiva y reactiva; no hay borrado real |
| Usuarios | `GET /usuarios` | `{ id, nombre, email, rol }`, solo ADMIN |

Modelos:

- `Evento`: `id, nombre, descripcion, fecha, horaInicio, horaFin, cupo, inscritos, cuposDisponibles, estado ("PROGRAMADO" | "CANCELADO"), ubicacion { id, nombre, direccion }`.
- `Ubicacion`: `id, nombre, descripcion, direccion, capacidad, activo, imagenPrincipal, imagenes`.
- `Inscripcion`: `id, estado ("PENDIENTE" | "CONFIRMADA" | "CANCELADA"), fechaInscripcion, evento`. El evento usa `EventoResumenDto` tras la Fase 2.

## Ajustes por caso de uso

**CU01.** El campo se etiqueta "Correo" y se envía como `email`. El rol sale de `rol` en el login y de `roles`, sin el prefijo `ROLE_`, en `/auth/me`. El menú muestra el nombre si existe y si no el correo.

**CU02.** Búsqueda y filtros van al servidor con debounce de 300 ms, y el grid se pagina. Las tarjetas usan la `imagenPrincipal` de su ubicación, porque los eventos no tienen imagen; si falta o falla, se usa un placeholder. El detalle consulta `GET /ubicaciones/{id}` para la capacidad. Un evento dura un solo día: se muestra `sáb 8 nov 2026, 14:00 a 16:00`.

**CU03.** Motivos de bloqueo: sin cupos, ya inscrito (`CONFIRMADA`), evento comenzado o terminado. El backend rechaza inscribirse desde `horaInicio`, no desde el fin. Un ADMIN no ve el botón, porque el backend responde 403. El toast muestra el mensaje del backend; sin él usa `El evento no está disponible` para 404 y `No se pudo completar la inscripción` para 409. El backend también responde 409 "El evento no está disponible" para eventos cancelados, y no existe el 409 de capacidad al inscribirse.

**CU04.** "Activas" filtra `CONFIRMADA` y "Canceladas" filtra `CANCELADA`. "Cancelar asistencia" llama a `DELETE /inscripciones/{id}`. Volver a inscribirse reactiva la misma inscripción.

**CU05.** La acción "Eliminar" pasa a llamarse **Cancelar evento**, y el aviso indica que cancela sus inscripciones. La tabla muestra los cancelados con sello; no se pueden editar y el motivo se explica. El formulario pide nombre, descripción, ubicación, fecha, hora de inicio, hora de fin y cupo. No pide imagen. Validaciones zod: fin posterior a inicio, nunca en el pasado (el backend lo exige también al editar), cupo entero mayor que 0 y hasta la capacidad. Con inscritos, fecha, horas y ubicación quedan bloqueados con su explicación, y el cupo no baja de `inscritos`.

**CU06.** La tabla muestra nombre, correo y fecha de registro de los confirmados, con sello `Inscrito`, porque la API no devuelve otros estados. El combobox lista solo usuarios `VISITANTE`, porque los administradores no pueden inscribirse.

**CU07.** Número de eventos: `totalElements` de `GET /eventos?ubicacionId={id}&size=1`, consultado por fila, e incluye cancelados. El aviso de capacidad compara con los eventos de la ubicación. La acción "Eliminar" pasa a llamarse **Desactivar**: el botón no se deshabilita y muestra el 409 del backend, que es quien sabe si hay eventos activos. El Switch aparece solo al editar y llama a desactivar o reactivar. Toda ubicación nueva nace activa. `imagenPrincipal` debe ser `https`. El formulario añade descripción y reenvía `imagenes`, porque el `PUT` las borra si faltan.

## Rutas

| Ruta | Acceso |
|---|---|
| `/login` | Pública; con sesión redirige según el rol |
| `/` | Redirige según el rol |
| `/eventos`, `/eventos/:id` | ADMIN y VISITANTE |
| `/mis-inscripciones` | VISITANTE |
| `/admin/eventos`, `/admin/eventos/:id/asistentes`, `/admin/ubicaciones` | ADMIN |

Un rol sin permiso va a su página inicial. Las rutas desconocidas muestran una página 404 en español.

## Modo mock

Con `VITE_USE_MOCKS=true`, MSW responde el contrato real con estado en memoria y las mismas reglas, incluidos los endpoints de la Fase 2. Una franja visible indica "Datos de ejemplo".

El panel **Simular error** existe solo en este modo. Permite forzar en la siguiente petición cada caso: evento no disponible, ya inscrito, evento lleno, choque de horario y error del servidor. El código del panel no entra en el flujo de la app real.

Credenciales de ejemplo en el README. Eventos, personas y lugares son sintéticos.

## Pruebas

Vitest para `api.ts` (CSRF, errores, excepciones del 401), esquemas zod y reglas derivadas. El recorrido de CU01 a CU07 se verifica en navegador con el mock, en móvil y escritorio, en claro y oscuro. La prueba contra la API real se hace al terminar la Fase 2.

## Entregables

Proyecto, `.env.example`, README con instrucciones, rutas, cómo cambiar endpoints y cómo crear visitantes con `POST /auth/registro`, modo mock y `DESIGN.md`.

## Fase 2: backend

Después del frontend, en una rama nueva desde `dev`, con diseño y plan propios:

1. Integrar `feature/inscripciones` con `dev`, que están divergidas. Unificar `dto`/`dtos` y `mapper`/`mappers`, y `fechaInscripcion` como `LocalDateTime`.
2. Devolver `EventoResumenDto` en vez de la entidad. Hoy `Object evento` probablemente responde 500, porque `Ubicacion.imagenes` es diferida y `open-in-view` está desactivado.
3. Crear `POST` y `DELETE /eventos/{id}/inscritos` con las mismas reglas de `inscribir`.
4. Activar `server.error.include-message=always` y comprobar los mensajes.
5. Añadir `id`, `nombre` y `rol` a `/auth/me`.
6. Rechazar con 409 reducir la capacidad por debajo del cupo de un evento activo futuro.

Hasta entonces, con la API real, las inscripciones dependen de esa rama y CU06 no puede agregar ni retirar. En esas condiciones el frontend muestra el error recibido; no oculta las acciones.

## A criterio de quien construye

Organización interna de componentes, versión de Tailwind compatible con shadcn y React 18, datos del mock y detalles de espaciado dentro del contrato visual.
