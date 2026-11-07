# Aforo frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el frontend de Aforo que cubre CU01 a CU07 contra la API real y en modo mock.

**Architecture:** SPA con cliente HTTP único, servicios por recurso y hooks de TanStack Query. La interfaz usa los nombres del backend sin capa de traducción. MSW reproduce el contrato real con estado en memoria.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind 3.4, shadcn/ui, React Router 6, TanStack Query 5, react-hook-form, zod, date-fns, lucide-react, MSW 2, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-07-aforo-frontend-design.md`, que incorpora `docs/superpowers/specs/2026-11-07-especificacion-original.md`. Leer ambos antes de empezar. Si difieren, manda el diseño. El contrato visual está en `.impeccable/surfaces/src-routes-index-tsx.md` y el boceto en `.impeccable/mocks/decision/sellos.html`.

## Global Constraints

- Trabajar en la rama `feature/frontend`, nunca en `main`.
- Cada commit termina con `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Toda la interfaz en español. Fechas con date-fns y locale `es`.
- Formato de fecha: `sáb 8 nov 2026, 14:00`. Horario de evento: `sáb 8 nov 2026, 14:00 a 16:00`.
- Toda llamada a la API pasa por `src/lib/api.ts`, y todo endpoint vive en `src/services/*`.
- Toda vista de datos tiene estado de carga con Skeleton, vacío con ícono y texto, y error con botón "Reintentar".
- Todo botón deshabilitado explica el motivo.
- Colores solo por tokens: `#27348B`, `#EEF1FA`, `#171B33`, `#C8102E`, `#0B7A53`.
- Figtree en toda la interfaz. Barlow Condensed solo dentro de `Sello`. Cifras con `tabular-nums`.
- El verde solo marca lo que es del usuario, más el Badge de cupos de CU02.
- Sin eyebrows sobre títulos. Sin gradientes, glass ni sombras duras.
- Sin archivos ni imports del modo mock en el bundle cuando `VITE_USE_MOCKS` no sea `true`.
- La Fase 2 del backend queda fuera de este plan. No tocar `../backend`.

## Review Focus

1. Fechas: `2026-11-08` nunca se interpreta como UTC. Con `new Date("2026-11-08")` en El Salvador sale el día 7. Prueba en Task 2.
2. Sesión vencida a media operación: un 401 en una mutación lleva a `/login` una sola vez, sin bucles. Prueba en Task 1.
3. Doble clic al confirmar: una sola petición, con botón deshabilitado mientras está pendiente. Prueba en Task 8.
4. Filtrar estando en la página 3: el filtro vuelve a la página 0 y no muestra un vacío falso. Prueba en Task 7.
5. Editar una ubicación con galería: `imagenes` se reenvía y no se pierde. Prueba en Task 11.

---

### Task 0: Proyecto base

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig*.json`, `tailwind.config.ts`, `postcss.config.js`, `components.json`, `index.html`, `.gitignore`, `.env.example`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/test/setup.ts`, `src/components/ui/*`

**Interfaces:**
- Produces: alias `@/` a `src/`; `npm test`; `npm run build`; componentes shadcn; tokens en `src/index.css`.

- [ ] **Step 1: Crear rama y proyecto**

Run: `git checkout -b feature/frontend`, luego crear el proyecto Vite con plantilla `react-ts` en el directorio actual sin borrar `docs`, `.impeccable` ni `PRODUCT.md`.
Fijar `react` y `react-dom` en `^18.3.1`, `react-router-dom` en `^6`, `tailwindcss` en `^3.4`.

- [ ] **Step 2: Instalar dependencias**

Producción: `@tanstack/react-query react-hook-form @hookform/resolvers zod date-fns lucide-react sonner`.
Desarrollo: `msw vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`.

- [ ] **Step 3: Inicializar shadcn**

Usar `npx shadcn@2.3.0 init`, última línea pensada para Tailwind 3, y añadir: button card table dialog alert-dialog form input textarea select calendar popover badge tabs dropdown-menu sheet skeleton sonner command tooltip switch progress pagination label separator.
Expected: `react-day-picker` queda en la versión 8 compatible con React 18.

- [ ] **Step 4: Configurar proxy y entorno**

`vite.config.ts`: `server.proxy["/api"]` con destino `env.VITE_PROXY_TARGET ?? "http://localhost:8080"` y `changeOrigin: true`. Vitest con `environment: "jsdom"`, `setupFiles: "src/test/setup.ts"`, `globals: true`.

`.env.example` exacto:

```
VITE_API_URL=/api
VITE_PROXY_TARGET=http://localhost:8080
VITE_USE_MOCKS=false
```

- [ ] **Step 5: Definir tokens y tipografía**

En `src/index.css`, valores claros: `--background` `#EEF1FA`, `--foreground` `#171B33`, `--primary` `#27348B`, `--destructive` `#C8102E`, `--card` blanco, más `--success` `#0B7A53` y `--shell` `#27348B` con `--shell-foreground` blanco. Definir `.dark` con los mismos matices: fondo y tarjetas índigo muy oscuros, primario aclarado hasta contraste 4.5:1 sobre tarjeta, y rojo y verde aclarados igual. Cargar Figtree y Barlow Condensed desde Google Fonts en `index.html`. Tema de selección, foco y scrollbar desde tokens. `--radius: 0.5rem`.

- [ ] **Step 6: Verificar**

Run: `npm run build && npm test -- --passWithNoTests`
Expected: ambos terminan con código 0.

- [ ] **Step 7: Commit** `chore: crear proyecto base con vite, tailwind y shadcn`

### Task 1: Tipos y cliente HTTP

**Files:**
- Create: `src/types/index.ts`, `src/lib/api.ts`
- Test: `src/lib/api.test.ts`

**Interfaces:**
- Produces, en `src/types`:
  - `Rol = "ADMIN" | "VISITANTE"`; `EstadoInscripcion = "PENDIENTE" | "CONFIRMADA" | "CANCELADA"`; `EstadoEvento = "PROGRAMADO" | "CANCELADO"`
  - `Usuario { id; nombre; email; rol }`
  - `Sesion { email; rol: Rol; id?: number; nombre?: string }`
  - `MeResponse { email; roles?: string[]; rol?: Rol; id?: number; nombre?: string }`
  - `UbicacionResumen { id; nombre; direccion }`
  - `Ubicacion { id; nombre; descripcion: string|null; direccion; capacidad; activo; imagenPrincipal: string|null; imagenes: string[] }`
  - `UbicacionInput { nombre; descripcion?; direccion; capacidad; imagenPrincipal?; imagenes: string[] }`
  - `Evento { id; nombre; descripcion: string|null; fecha; horaInicio; horaFin; cupo; inscritos; cuposDisponibles; estado: EstadoEvento; ubicacion: UbicacionResumen }`
  - `EventoInput { nombre; descripcion?; fecha; horaInicio; horaFin; cupo; ubicacionId }`
  - `EventoResumen { id; nombre; fecha; horaInicio; horaFin; ubicacionNombre }`
  - `Inscripcion { id; estado: EstadoInscripcion; fechaInscripcion: string; evento: EventoResumen }`
  - `Inscrito { usuarioId; nombre; email; fechaInscripcion: string }`
  - `Page<T> { content: T[]; totalElements; totalPages; number; size }`
- Produces, en `src/lib/api.ts`:
  - `class ApiError extends Error { status: number; message: string }`; `status === 0` significa API inalcanzable
  - `api.get<T>(path, params?: Record<string, string|number|undefined>): Promise<T>`
  - `api.post<T>(path, body?)`, `api.put<T>(path, body)`, `api.patch<T>(path, body?)`, `api.del<T = void>(path)`
  - `mensajeError(error: unknown, porEstado: Partial<Record<number,string>>, generico: string): string`
  - `esApiCaida(error: unknown): boolean`

- [ ] **Step 1: Escribir las pruebas que fallan**

En `src/lib/api.test.ts`, con `fetch` simulado, un caso por afirmación:
- toda petición usa `credentials: "include"` y base `/api`;
- `post` con cookie `XSRF-TOKEN=abc%3D` envía `X-XSRF-TOKEN: abc=`; `get` no la envía;
- 409 con `{ "message": "El evento está lleno" }` lanza `ApiError` con status 409 y ese mensaje;
- 409 con `{ "status": 409, "error": "Conflict" }` lanza `ApiError` con `message === ""`;
- 204 resuelve `undefined`;
- 401 en `/eventos` llama a `location.assign("/login")`;
- dos 401 seguidos llaman a `assign` una sola vez;
- estando en `/login`, un 401 no llama a `assign`;
- 401 en `/auth/login` y en `/auth/me` lanza `ApiError` y no redirige;
- rechazo de `fetch` y 500 sin JSON lanzan `ApiError` con status 0;
- `params` omite `undefined` y cadenas vacías;
- `mensajeError` prioriza `error.message`, luego `porEstado[status]`, luego `generico`.

- [ ] **Step 2: Ejecutar y confirmar que fallan**

Run: `npx vitest run src/lib/api.test.ts`
Expected: FAIL, módulo inexistente.

- [ ] **Step 3: Implementar tipos y `api.ts`**

La cookie se lee de `document.cookie` y se pasa por `decodeURIComponent`. La base es `import.meta.env.VITE_API_URL ?? "/api"`. Un cuerpo no JSON con status mayor o igual a 500 se trata como status 0, porque es la respuesta del proxy de Vite cuando la API está apagada. También 502, 503 y 504 dan status 0. El bloqueo de redirección doble es una variable de módulo.

- [ ] **Step 4: Ejecutar y confirmar que pasan**

Run: `npx vitest run src/lib/api.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit** `feat: agregar tipos y cliente http con csrf`

### Task 2: Fechas, reglas y esquemas

**Files:**
- Create: `src/lib/fechas.ts`, `src/lib/reglas.ts`, `src/lib/esquemas.ts`
- Test: `src/lib/fechas.test.ts`, `src/lib/reglas.test.ts`, `src/lib/esquemas.test.ts`

**Interfaces:**
- Consumes: tipos de Task 1.
- Produces, en `fechas.ts`:
  - `aFechaLocal(fecha: string, hora = "00:00"): Date`
  - `formatoFechaHora(fecha: string, hora: string): string`
  - `formatoHorario(e: Pick<Evento,"fecha"|"horaInicio"|"horaFin">): string`
  - `formatoRegistro(valor: string): string`
  - `aFechaApi(d: Date): string`, devuelve `yyyy-MM-dd`
- Produces, en `reglas.ts`:
  - `type EstadoSello = "Inscrito"|"Lleno"|"Finalizado"|"Cancelado"|"Cancelada"`
  - `haComenzado(e, ahora: Date): boolean`; `haTerminado(e, ahora: Date): boolean`
  - `motivoBloqueo(e: Evento, c: { inscrito: boolean; ahora: Date }): string | null`
  - `selloDeEvento(e: Evento, c: { inscrito: boolean; ahora: Date }): EstadoSello | null`
  - `motivoEdicionBloqueada(e: Evento): string | null`
  - `aSesion(me: MeResponse): Sesion`
  - `rutaInicial(rol: Rol): string`
- Produces, en `esquemas.ts`: `loginSchema`, `eventoSchema({ capacidad?: number; ahora: Date; minimoCupo?: number })`, `ubicacionSchema`, con tipos `LoginValues`, `EventoValues` y `UbicacionValues`.
  - `EventoValues { nombre; descripcion?; fecha: Date; horaInicio; horaFin; cupo: number; ubicacionId: number }`
  - `aEventoInput(v: EventoValues): EventoInput`

- [ ] **Step 1: Escribir las pruebas que fallan**

`fechas.test.ts`, con `process.env.TZ = "America/El_Salvador"` fijado para el archivo:
- `aFechaLocal("2026-11-08").getDate() === 8`;
- `formatoFechaHora("2026-11-08", "14:00:00") === "sáb 8 nov 2026, 14:00"`;
- `formatoHorario({ fecha: "2026-11-08", horaInicio: "14:00:00", horaFin: "16:00:00" }) === "sáb 8 nov 2026, 14:00 a 16:00"`;
- `formatoRegistro("2026-11-08T09:30:00") === "sáb 8 nov 2026, 09:30"`;
- `formatoRegistro("09:30:00") === "09:30"`, porque `dev` aún envía `LocalTime`;
- `aFechaApi(new Date(2026, 10, 8, 23, 30)) === "2026-11-08"`.

`reglas.test.ts`, con evento del 2026-11-08 de 14:00 a 16:00 y `ahora` fijado:
- `motivoBloqueo` devuelve, en este orden de prioridad: `"Este evento fue cancelado"`, `"El evento ya terminó"`, `"El evento ya comenzó"`, `"Ya estás inscrito en este evento"`, `"El evento está lleno"`, y `null` cuando se puede;
- a las 15:00, con evento en curso, devuelve `"El evento ya comenzó"`;
- `selloDeEvento` prioriza Cancelado, Finalizado, Inscrito y Lleno;
- `motivoEdicionBloqueada` de un cancelado es `"No se puede editar un evento cancelado"`;
- `aSesion({ email, roles: ["ROLE_ADMIN"] }).rol === "ADMIN"`, y conserva `rol`, `id` y `nombre` si llegan;
- `rutaInicial("ADMIN") === "/admin/eventos"` y `rutaInicial("VISITANTE") === "/eventos"`.

`esquemas.test.ts`:
- `loginSchema` rechaza correo inválido y contraseña vacía;
- `eventoSchema` rechaza `horaFin` igual o anterior a `horaInicio` con error en `horaFin`;
- rechaza fecha pasada, y hoy con `horaInicio` ya pasada, también al editar;
- rechaza cupo 0, 1.5, mayor que `capacidad`, y menor que `minimoCupo`;
- `ubicacionSchema` rechaza capacidad 0 y `imagenPrincipal` con `http://`;
- `ubicacionSchema` acepta `imagenPrincipal` vacía.

- [ ] **Step 2: Ejecutar y confirmar que fallan**

Run: `npx vitest run src/lib/`
Expected: FAIL en los tres archivos nuevos.

- [ ] **Step 3: Implementar**

`aFechaLocal` separa año, mes y día, y construye con `new Date(y, m-1, d, h, min)`. El formato base es `"EEE d MMM yyyy, HH:mm"` con locale `es`; si date-fns añade puntos a las abreviaturas, se eliminan. Mensajes zod en español.

- [ ] **Step 4: Ejecutar y confirmar que pasan**

Run: `npx vitest run src/lib/`
Expected: PASS.

- [ ] **Step 5: Commit** `feat: agregar reglas de negocio, fechas y esquemas`

### Task 3: Servicios y hooks

**Files:**
- Create: `src/services/auth.ts`, `eventos.ts`, `inscripciones.ts`, `ubicaciones.ts`, `usuarios.ts`, `src/hooks/queryKeys.ts`, `useEventos.ts`, `useInscripciones.ts`, `useUbicaciones.ts`, `useUsuarios.ts`

**Interfaces:**
- Consumes: `api` y tipos.
- Produces, servicios:
  - `login(email, password): Promise<Usuario>`; `logout()`; `getMe(): Promise<MeResponse>`
  - `listarEventos(f: FiltrosEventos): Promise<Page<Evento>>`; `obtenerEvento(id)`; `crearEvento(i)`; `actualizarEvento(id, i)`; `cancelarEvento(id)`
  - `listarInscritos(id, page)`; `agregarInscrito(eventoId, usuarioId)`; `retirarInscrito(eventoId, usuarioId)`
  - `inscribirse(eventoId)`; `listarMias(estado, page)`; `cancelarInscripcion(id)`
  - `listarUbicaciones({ nombre?, page?, size? })`; `obtenerUbicacion(id)`; `crearUbicacion(i)`; `actualizarUbicacion(id, i)`; `desactivarUbicacion(id)`; `reactivarUbicacion(id)`
  - `listarUsuarios(page, size)`
  - `FiltrosEventos { nombre?; desde?; hasta?; ubicacionId?; page?; size? }`; siempre envía `sort=fecha,asc`, y `size` por defecto 12
- Produces, hooks: `useEventos(f)`, `useEvento(id)`, `useCrearEvento()`, `useActualizarEvento()`, `useCancelarEvento()`, `useInscritos(id, page)`, `useAgregarInscrito(eventoId)`, `useRetirarInscrito(eventoId)`, `useInscribirse()`, `useMias(estado, page)`, `useCancelarInscripcion()`, `useUbicaciones(params)`, `useUbicacion(id)`, `useGuardarUbicacion()`, `useCambiarActivaUbicacion()`, `useConteoEventos(ubicacionId)`, `useUsuariosVisitantes()`

- [ ] **Step 1: Implementar servicios, claves y hooks**

`useMias` y las listas usan `placeholderData: keepPreviousData`. `useConteoEventos` llama `listarEventos({ ubicacionId, size: 1 })` y devuelve `totalElements`. `useUsuariosVisitantes` pide `size=50` y filtra `rol === "VISITANTE"`. Toda mutación de inscripción invalida eventos, mias e inscritos. Mutaciones de evento invalidan eventos. Mutaciones de ubicación invalidan ubicaciones y eventos.

- [ ] **Step 2: Verificar**

Run: `npx tsc --noEmit`
Expected: sin errores. Estos archivos se ejercitan en las pruebas de Tasks 4 y 7 a 11.

- [ ] **Step 3: Commit** `feat: agregar servicios y hooks de datos`

### Task 4: Modo mock

**Files:**
- Create: `src/mocks/db.ts`, `src/mocks/handlers.ts`, `src/mocks/browser.ts`, `src/mocks/simulador.ts`, `src/mocks/PanelSimular.tsx`, `src/mocks/server.ts`, `public/mockServiceWorker.js`
- Modify: `src/main.tsx`
- Test: `src/mocks/handlers.test.ts`

**Interfaces:**
- Consumes: servicios de Task 3 en las pruebas.
- Produces:
  - `reiniciarDb(ahora?: Date): void`
  - `type ErrorSimulado = "EVENTO_NO_EXISTE"|"NO_DISPONIBLE"|"YA_INSCRITO"|"LLENO"|"HORARIO"|"SIN_MENSAJE"|"SERVIDOR"`
  - `simularError(t: ErrorSimulado | null): void`
  - `server` de `msw/node` para pruebas posteriores
  - Credenciales: `admin@aforo.test` / `admin1234`, `visitante@aforo.test` / `visitante1234`

- [ ] **Step 1: Escribir las pruebas que fallan**

Con `server.listen` y `reiniciarDb(new Date(2026, 10, 7))`:
- login incorrecto da 401 con `"Credenciales inválidas"`; correcto devuelve `Usuario`;
- `getMe` sin sesión da 401;
- `listarEventos({ nombre: "cerámica", size: 12 })` devuelve `Page` filtrada;
- `listarEventos` como visitante excluye cancelados, y como admin los incluye;
- `inscribirse` dos veces da 409 `"Ya estás inscrito en este evento"`;
- evento lleno da 409 `"El evento está lleno"`;
- solape da 409 `"Tienes otra inscripción activa en este horario"`;
- evento cancelado da 409 `"El evento no está disponible"`;
- id inexistente da 404 `"El evento no existe"`;
- evento comenzado da 409 `"El evento ya comenzó"`;
- admin que se inscribe da 403;
- cancelar y reinscribirse reutiliza el mismo `id`;
- `cancelarEvento` cancela sus inscripciones;
- `desactivarUbicacion` con evento activo futuro da 409 con el texto del backend;
- `actualizarEvento` con inscritos y fecha distinta da 409 con el texto del backend;
- `simularError("LLENO")` afecta solo a la siguiente inscripción;
- `simularError("SIN_MENSAJE")` da 409 con cuerpo sin `message`.

- [ ] **Step 2: Ejecutar y confirmar que fallan**

Run: `npx vitest run src/mocks/`
Expected: FAIL.

- [ ] **Step 3: Implementar `db`, handlers y simulador**

Los textos de error se copian de `git show origin/dev:src/main/java/com/eventos/services/EventoService.java`, `UbicacionService.java` y `origin/feature/inscripciones:.../InscripcionService.java`, en `../backend/sistema-gestion-de-eventos`. Las fechas sembradas se calculan relativas a `ahora`, para que la demo nunca caduque. Debe haber al menos 8 ubicaciones y eventos, incluidos uno lleno, uno finalizado, uno en curso, uno cancelado, dos que se solapen y uno con inscrito sembrado. El estado se guarda en `sessionStorage` en el navegador. Las imágenes de ubicación usan URLs `https` externas; una de ellas debe fallar a propósito para mostrar el placeholder. Los handlers usan el patrón `*/api/...` y paginan como Spring.

- [ ] **Step 4: Implementar arranque y panel**

En `main.tsx`, con `import.meta.env.VITE_USE_MOCKS === "true"`, usar `await import("./mocks/browser")` e iniciar el worker antes de montar React, con el import detrás de esa condición para que Vite lo excluya. `PanelSimular` es un botón flotante "Simular error" que abre un Popover con un Select de tipos, junto a la franja "Datos de ejemplo". Ambos se montan solo en esta rama.

- [ ] **Step 5: Ejecutar y confirmar**

Run: `npx vitest run src/mocks/ && npm run build && grep -rl "Simular error" dist/assets | wc -l`
Expected: pruebas en PASS y, sin `VITE_USE_MOCKS`, conteo 0.

- [ ] **Step 6: Commit** `feat: agregar modo mock con simulador de errores`

### Task 5: Componentes compartidos

**Files:**
- Create: `src/components/Sello.tsx`, `CuposBadge.tsx`, `ConfirmDialog.tsx`, `EstadoVacio.tsx`, `EstadoError.tsx`, `Paginacion.tsx`, `ImagenConPlaceholder.tsx`, `BotonConMotivo.tsx`
- Test: `src/components/componentes.test.tsx`

**Interfaces:**
- Consumes: `EstadoSello`.
- Produces:
  - `<Sello estado={EstadoSello} animar?={boolean} />`
  - `<CuposBadge disponibles={number} />`
  - `<ConfirmDialog open onOpenChange titulo descripcion accion onConfirm pendiente destructivo? />`
  - `<EstadoVacio icono titulo descripcion? accion? />`
  - `<EstadoError error onRetry />`
  - `<Paginacion page totalPages onChange />`, con `page` desde 0; no renderiza con `totalPages <= 1`
  - `<ImagenConPlaceholder src alt className />`
  - `<BotonConMotivo motivo={string|null} {...buttonProps} />`

- [ ] **Step 1: Escribir las pruebas que fallan**

- `CuposBadge` con 0 muestra `Lleno` y con 8 muestra `8 cupos`;
- `ImagenConPlaceholder` tras `fireEvent.error` muestra el placeholder, y con `src` nulo lo muestra de entrada;
- `ConfirmDialog` con `pendiente` tiene la acción deshabilitada;
- `BotonConMotivo` con motivo queda deshabilitado y muestra el texto visible debajo del botón, no solo en Tooltip, para que funcione en móvil;
- `Paginacion` con `totalPages=1` no renderiza nada;
- `EstadoError` llama a `onRetry` al pulsar "Reintentar".

- [ ] **Step 2: Ejecutar y confirmar que fallan**

Run: `npx vitest run src/components/`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`Sello`: fondo de tarjeta, borde de 3px en `currentColor`, Barlow Condensed 700, mayúsculas, `tracking-[.06em]`, rotación -6°. Colores: Inscrito verde; Lleno, Cancelado y Cancelada rojo; Finalizado tinta. Sin rotación a tamaño de tabla. Con `animar`, entra en 200 ms de escala 1.4 a 1 con ease-out; sin animación bajo `prefers-reduced-motion`.

- [ ] **Step 4: Ejecutar y confirmar que pasan**

Run: `npx vitest run src/components/`
Expected: PASS.

- [ ] **Step 5: Commit** `feat: agregar componentes compartidos y sello de estado`

### Task 6: Sesión, rutas y layout

**Files:**
- Create: `src/features/auth/AuthContext.tsx`, `src/features/auth/LoginPage.tsx`, `src/features/auth/ApiCaidaPage.tsx`, `src/routes/index.tsx`, `src/routes/guards.tsx`, `src/components/layout/AppLayout.tsx`, `AdminLayout.tsx`, `Navbar.tsx`, `ThemeProvider.tsx`, `ThemeToggle.tsx`, `src/features/NotFoundPage.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`
- Test: `src/features/auth/auth.test.tsx`

**Interfaces:**
- Consumes: `aSesion`, `rutaInicial`, `esApiCaida`, servicios de auth.
- Produces:
  - `useAuth(): { sesion: Sesion|null; cargando: boolean; apiCaida: boolean; iniciarSesion(email, password): Promise<Sesion>; cerrarSesion(): Promise<void>; reintentar(): void }`
  - `<RequireAuth />` y `<RequireRole role="ADMIN" />` con `Outlet`
  - Rutas: las de la sección Rutas del diseño. Las páginas de Tasks 7 a 11 se registran aquí con carga diferida (`React.lazy`)

- [ ] **Step 1: Escribir las pruebas que fallan**

Con `MemoryRouter`, y `server` de Task 4:
- sin sesión, `/eventos` lleva a `/login`;
- login incorrecto muestra `Credenciales inválidas` dentro del formulario;
- login como admin lleva a `/admin/eventos`; como visitante, a `/eventos`;
- con sesión, abrir `/login` redirige según rol;
- visitante en `/admin/eventos` va a `/eventos`;
- `getMe` con status 0 muestra `No se puede conectar con la API`, y "Reintentar" repite la consulta;
- el 401 de `/auth/me` no muestra esa pantalla;
- `cerrarSesion` lleva a `/login` y limpia la caché de queries.

- [ ] **Step 2: Ejecutar y confirmar que fallan**

Run: `npx vitest run src/features/auth/`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Navbar según el boceto: `--shell`, alto 72px, logotipo tipográfico "Aforo" en Figtree 800, enlaces por rol, ThemeToggle y DropdownMenu con nombre o correo, rol y "Cerrar sesión". En móvil, los enlaces pasan a Sheet. `AdminLayout`: sidebar con Eventos y Ubicaciones; en móvil, Sheet. `ThemeProvider` de shadcn con clase `dark` en `html` y `localStorage` envuelto en try/catch. `ApiCaidaPage` explica `VITE_USE_MOCKS=true` y `VITE_PROXY_TARGET`.

- [ ] **Step 4: Ejecutar y confirmar que pasan**

Run: `npx vitest run src/features/auth/`
Expected: PASS.

- [ ] **Step 5: Commit** `feat: agregar sesión, rutas protegidas y layout`

### Task 7: CU02 eventos

**Files:**
- Create: `src/features/eventos/EventosPage.tsx`, `EventoDetallePage.tsx`, `FiltrosEventos.tsx`, `src/components/EventCard.tsx`, `src/hooks/useImagenesUbicacion.ts`, `src/hooks/useDebounce.ts`
- Test: `src/features/eventos/eventos.test.tsx`

**Interfaces:**
- Consumes: hooks de Task 3 y componentes de Task 5.
- Produces:
  - `<EventCard evento imagen sello />`
  - `useImagenesUbicacion(): Map<number, string|null>`, desde `useUbicaciones({ size: 50 })`
  - En detalle, el espacio de acción `<AccionesEvento evento />` lo completa Task 8

- [ ] **Step 1: Escribir las pruebas que fallan**

- durante la carga aparecen Skeletons;
- la tarjeta muestra nombre, `sáb 8 nov 2026, 14:00`, ubicación y cupos;
- buscar envía `nombre` tras el debounce;
- estando en la página 2, filtrar por ubicación pide `page=0`;
- sin resultados con filtros muestra `No hay eventos con esos filtros`; sin filtros, `Aún no hay eventos`;
- error de lista muestra "Reintentar";
- detalle muestra capacidad, `Progress` con `inscritos / cupo` y horario;
- detalle con 404 muestra `El evento no está disponible`.

- [ ] **Step 2: Ejecutar y confirmar que fallan**

Run: `npx vitest run src/features/eventos/`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Rejilla por columnas enteras: 1, 2, 3 y 4 columnas en `sm`, `lg` y `xl`. Los filtros se guardan en `useSearchParams`, de modo que recargar conserva la vista. Rango con Calendar en Popover, y Select de ubicaciones. En detalle, la imagen encabeza y la acción primaria domina. Las tarjetas son enlaces completos.

- [ ] **Step 4: Ejecutar y confirmar que pasan**

Run: `npx vitest run src/features/eventos/`
Expected: PASS.

- [ ] **Step 5: Commit** `feat: agregar cartelera y detalle de eventos`

### Task 8: CU03 inscribirse y CU04 cancelar

**Files:**
- Create: `src/features/inscripciones/AccionesEvento.tsx`, `MisInscripcionesPage.tsx`, `mensajes.ts`
- Modify: `src/features/eventos/EventoDetallePage.tsx`, `src/routes/index.tsx`
- Test: `src/features/inscripciones/inscripciones.test.tsx`

**Interfaces:**
- Consumes: `useInscribirse`, `useMias`, `useCancelarInscripcion`, `motivoBloqueo`, `mensajeError`, `ConfirmDialog`, `BotonConMotivo`, `Sello`.
- Produces: `mensajeInscripcion(error): string` en `mensajes.ts`, reutilizado por Task 10, con `{404: "El evento no está disponible"}` y genérico `"No se pudo completar la inscripción"`.

- [ ] **Step 1: Escribir las pruebas que fallan**

- visitante ve "Inscribirme"; admin ve "Gestionar asistentes" y no "Inscribirme";
- evento lleno, ya inscrito, comenzado y terminado deshabilitan con su motivo visible;
- doble clic en confirmar genera un solo `POST`;
- éxito muestra `Sello` Inscrito, baja los cupos en su sitio y muestra toast;
- `simularError("HORARIO")` muestra el texto del backend en un toast;
- `simularError("SIN_MENSAJE")` muestra `No se pudo completar la inscripción`;
- `/mis-inscripciones` muestra Tabs "Activas" y "Canceladas", con `estado=CONFIRMADA` y `estado=CANCELADA`;
- "Cancelar asistencia" llama a `DELETE /inscripciones/{id}` tras confirmar, y la fila pasa a Canceladas;
- la pestaña Canceladas no muestra el botón.

- [ ] **Step 2: Ejecutar y confirmar que fallan**

Run: `npx vitest run src/features/inscripciones/`
Expected: FAIL.

- [ ] **Step 3: Implementar**

"Ya inscrito" se calcula con `useMias("CONFIRMADA", 0)` a tamaño 50. La tabla colapsa a filas apiladas en móvil. El sello se anima solo cuando la inscripción acaba de confirmarse.

- [ ] **Step 4: Ejecutar y confirmar que pasan**

Run: `npx vitest run src/features/inscripciones/`
Expected: PASS.

- [ ] **Step 5: Commit** `feat: agregar inscripción y cancelación de asistencia`

### Task 9: CU05 eventos admin

**Files:**
- Create: `src/features/eventos/AdminEventosPage.tsx`, `src/components/EventoForm.tsx`, `src/components/CampoFecha.tsx`
- Modify: `src/routes/index.tsx`
- Test: `src/features/eventos/admin-eventos.test.tsx`

**Interfaces:**
- Consumes: `eventoSchema`, `aEventoInput`, `motivoEdicionBloqueada`, hooks de eventos y ubicaciones.
- Produces: `<EventoForm evento? open onOpenChange />`.

- [ ] **Step 1: Escribir las pruebas que fallan**

- tabla con nombre, horario, ubicación y `inscritos/cupo`; búsqueda en servidor;
- evento cancelado muestra sello y "Editar" deshabilitado con motivo;
- DropdownMenu ofrece Ver, Editar, Gestionar asistentes y Cancelar evento;
- el Select solo ofrece ubicaciones activas;
- junto al cupo aparece `Capacidad máxima: 80`;
- cupo mayor que la capacidad muestra error y no envía;
- crear choque de horario muestra en el formulario `El evento choca en horario con otro evento en la misma ubicación`, y el Sheet sigue abierto;
- editar con inscritos bloquea fecha, horas y ubicación con su explicación;
- confirmar "Cancelar evento" avisa de que se cancelan sus inscripciones.

- [ ] **Step 2: Ejecutar y confirmar que fallan**

Run: `npx vitest run src/features/eventos/admin-eventos.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Formulario en Sheet. `CampoFecha` usa Calendar en Popover, y las horas usan `input type="time"`. Al editar, `minimoCupo` es `evento.inscritos`. Los errores 400 y 409 van a `form.setError("root")` y se pintan arriba de los botones. Si la ubicación actual está inactiva al editar, el Select la incluye marcada como inactiva.

- [ ] **Step 4: Ejecutar y confirmar que pasan**

Run: `npx vitest run src/features/eventos/admin-eventos.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit** `feat: agregar administración de eventos`

### Task 10: CU06 asistentes

**Files:**
- Create: `src/features/asistentes/AsistentesPage.tsx`, `AgregarAsistenteDialog.tsx`
- Modify: `src/routes/index.tsx`
- Test: `src/features/asistentes/asistentes.test.tsx`

**Interfaces:**
- Consumes: `useInscritos`, `useAgregarInscrito`, `useRetirarInscrito`, `useUsuariosVisitantes`, `mensajeInscripcion`.

- [ ] **Step 1: Escribir las pruebas que fallan**

- encabezado con datos del evento y `inscritos/cupo`;
- tabla con nombre, correo, fecha de registro y sello Inscrito;
- el Combobox busca por nombre o correo y excluye a quienes ya están inscritos;
- agregar con 409 muestra el mensaje en toast y deja el Dialog abierto;
- "Retirar" confirma antes y actualiza la fila;
- 404 en estos endpoints, caso de la API real antes de la Fase 2, muestra el toast `El evento no está disponible`, sin ocultar la acción.

- [ ] **Step 2: Ejecutar y confirmar que fallan**

Run: `npx vitest run src/features/asistentes/`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Dialog con Command de shadcn. Evento lleno, finalizado o cancelado deshabilita "Agregar asistente" con `BotonConMotivo`.

- [ ] **Step 4: Ejecutar y confirmar que pasan**

Run: `npx vitest run src/features/asistentes/`
Expected: PASS.

- [ ] **Step 5: Commit** `feat: agregar gestión de asistentes`

### Task 11: CU07 ubicaciones

**Files:**
- Create: `src/features/ubicaciones/UbicacionesPage.tsx`, `src/components/UbicacionForm.tsx`
- Modify: `src/routes/index.tsx`
- Test: `src/features/ubicaciones/ubicaciones.test.tsx`

**Interfaces:**
- Consumes: `ubicacionSchema`, hooks de ubicaciones, `useConteoEventos`, `listarEventos`.
- Produces: `<UbicacionForm ubicacion? open onOpenChange />`.

- [ ] **Step 1: Escribir las pruebas que fallan**

- tabla con nombre, dirección, capacidad, estado y número de eventos;
- crear no muestra el Switch; editar sí;
- al editar con `imagenes: ["https://a", "https://b"]`, el `PUT` conserva esas dos URLs;
- bajar la capacidad por debajo de un cupo existente muestra el aviso con el nombre del evento y permite guardar;
- "Desactivar" con eventos activos muestra el 409 del backend en un toast;
- el Switch apagado llama a `DELETE`, y encendido a `PATCH /reactivar`;
- nombre repetido muestra `Ya existe una ubicación con ese nombre` en el formulario.

- [ ] **Step 2: Ejecutar y confirmar que fallan**

Run: `npx vitest run src/features/ubicaciones/`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Formulario en Dialog. El aviso consulta `listarEventos({ ubicacionId, size: 50 })` al cambiar la capacidad, con debounce, y descarta los eventos cancelados.

- [ ] **Step 4: Ejecutar y confirmar que pasan**

Run: `npx vitest run src/features/ubicaciones/`
Expected: PASS.

- [ ] **Step 5: Commit** `feat: agregar administración de ubicaciones`

### Task 12: README y cierre

**Files:**
- Create: `README.md`, `DESIGN.md`, `.impeccable/design.json`
- Modify: lo que resulte de la revisión

**Interfaces:**
- Consumes: la app completa.

- [ ] **Step 1: Escribir el README**

Debe cubrir: requisitos; arranque con API real; modo mock y sus credenciales; Docker Compose con `VITE_PROXY_TARGET=http://localhost`; crear visitantes con `POST /api/auth/registro`; admin inicial con `ADMIN_EMAIL` y `ADMIN_PASSWORD`; lista de rutas; cómo cambiar endpoints en `src/services`; y limitaciones hasta la Fase 2.

- [ ] **Step 2: Verificar todo**

Run: `npm test && npm run lint && npm run build`
Expected: código 0 en los tres.

- [ ] **Step 3: Recorrer la app en el navegador**

Con `VITE_USE_MOCKS=true`, recorrer CU01 a CU07 a 1440 y 390 de ancho, en claro y oscuro. Incluir estados de carga, vacío, error, API caída y Simular error. Comprobar la consola sin errores. Probar también sin `.env`, con la API apagada: debe aparecer `No se puede conectar con la API`.

- [ ] **Step 4: Ejecutar el detector de diseño**

Run: `C:\Users\HACKER\.claude\skills\impeccable\scripts\impeccable.cmd detect --json src index.html`
Expected: resultados mecánicos corregidos y el resto anotado para la revisión.

- [ ] **Step 5: Revisión final y documentación**

Capturar en `.impeccable/review/desktop.png` y `mobile.png`. Lanzar el revisor `impeccable-finish-reviewer` con el pedido original, el contrato, el boceto como referencia y las capturas. Aplicar su veredicto según `reference/new-work.md`, sección 7. Después lanzar `impeccable-documenter` para producir `DESIGN.md` y `.impeccable/design.json`.

- [ ] **Step 6: Commit** `docs: agregar readme y sistema de diseño`
