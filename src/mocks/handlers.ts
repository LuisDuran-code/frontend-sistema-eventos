import { format, startOfDay } from 'date-fns'
import { http, HttpResponse, type HttpResponseResolver } from 'msw'
import { aFechaLocal } from '@/lib/fechas'
import type { Evento, EventoInput, EventoResumen, UbicacionInput } from '@/types'
import { ahora, guardarDb, imagen, obtenerDb, type EventoDb, type InscripcionDb, type UsuarioDb } from './db'
import { consumirError } from './simulador'

const TEXTO_ESTADO: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
}

class Fallo extends Error {
  status: number
  mensaje?: string

  constructor(status: number, mensaje?: string) {
    super(mensaje)
    this.status = status
    this.mensaje = mensaje
  }
}

function fallar(status: number, mensaje?: string): never {
  throw new Fallo(status, mensaje)
}

function ruta(resolver: HttpResponseResolver<Record<string, string>, never>): HttpResponseResolver<Record<string, string>, never> {
  return async (info) => {
    try {
      const respuesta = await resolver(info)
      guardarDb()
      return respuesta
    } catch (e) {
      if (!(e instanceof Fallo)) throw e
      const cuerpo = { status: e.status, error: TEXTO_ESTADO[e.status], ...(e.mensaje && { message: e.mensaje }) }
      return HttpResponse.json(cuerpo, { status: e.status })
    }
  }
}

function usuarioActual(): UsuarioDb {
  const db = obtenerDb()
  const usuario = db.usuarios.find((u) => u.email === db.sesion)
  return usuario ?? fallar(401)
}

function exigirAdmin(): UsuarioDb {
  const usuario = usuarioActual()
  return usuario.rol === 'ADMIN' ? usuario : fallar(403)
}

function aPublico({ id, nombre, email, rol }: UsuarioDb) {
  return { id, nombre, email, rol }
}

function paginar<T>(lista: T[], url: URL, sizeBase = 10) {
  const number = Number(url.searchParams.get('page') ?? 0)
  const size = Math.min(Number(url.searchParams.get('size') ?? sizeBase), 50)
  return {
    content: lista.slice(number * size, (number + 1) * size),
    page: { size, number, totalElements: lista.length, totalPages: Math.ceil(lista.length / size) },
  }
}

function confirmados(eventoId: number): InscripcionDb[] {
  return obtenerDb().inscripciones.filter((i) => i.eventoId === eventoId && i.estado === 'CONFIRMADA')
}

function aEvento(e: EventoDb): Evento {
  const u = obtenerDb().ubicaciones.find((x) => x.id === e.ubicacionId)!
  const inscritos = confirmados(e.id).length
  return {
    id: e.id,
    nombre: e.nombre,
    descripcion: e.descripcion,
    fecha: e.fecha,
    horaInicio: e.horaInicio,
    horaFin: e.horaFin,
    cupo: e.cupo,
    inscritos,
    cuposDisponibles: Math.max(0, e.cupo - inscritos),
    estado: e.activo ? 'PROGRAMADO' : 'CANCELADO',
    ubicacion: { id: u.id, nombre: u.nombre, direccion: u.direccion },
    imagenes: e.imagenes,
  }
}

function aResumen(e: EventoDb): EventoResumen {
  const u = obtenerDb().ubicaciones.find((x) => x.id === e.ubicacionId)!
  return { id: e.id, nombre: e.nombre, fecha: e.fecha, horaInicio: e.horaInicio, horaFin: e.horaFin, ubicacionNombre: u.nombre }
}

function aInscripcion(i: InscripcionDb) {
  const evento = obtenerDb().eventos.find((e) => e.id === i.eventoId)!
  return { id: i.id, estado: i.estado, fechaInscripcion: i.fechaInscripcion, evento: aResumen(evento) }
}

function buscarEvento(id: string): EventoDb {
  const evento = obtenerDb().eventos.find((e) => e.id === Number(id))
  return evento ?? fallar(404, 'Evento no encontrado')
}

function buscarUbicacion(id: string) {
  const u = obtenerDb().ubicaciones.find((x) => x.id === Number(id))
  return u ?? fallar(404, 'Ubicación no encontrada')
}

function hora(valor: string): string {
  return valor.length === 5 ? `${valor}:00` : valor
}

function validarHorario(i: EventoInput) {
  if (i.horaFin <= i.horaInicio) fallar(400, 'La hora de fin debe ser posterior a la hora de inicio')
  const fecha = aFechaLocal(i.fecha)
  if (fecha < startOfDay(ahora())) fallar(400, 'La fecha del evento no puede estar en el pasado')
  if (aFechaLocal(i.fecha, i.horaInicio) <= ahora()) fallar(400, 'La hora de inicio del evento ya pasó')
}

function validarUbicacion(i: EventoInput) {
  const u = obtenerDb().ubicaciones.find((x) => x.id === i.ubicacionId) ?? fallar(404, 'La ubicación no existe')
  if (!u.activo) fallar(409, 'La ubicación está inactiva')
  if (i.cupo > u.capacidad) fallar(409, `El cupo supera la capacidad máxima de la ubicación (${u.capacidad})`)
}

function validarSolape(i: EventoInput, excluirId?: number) {
  const inicio = hora(i.horaInicio)
  const fin = hora(i.horaFin)
  const choca = obtenerDb().eventos.some(
    (e) =>
      e.id !== excluirId &&
      e.activo &&
      e.ubicacionId === i.ubicacionId &&
      e.fecha === i.fecha &&
      e.horaInicio < fin &&
      e.horaFin > inicio,
  )
  if (choca) fallar(409, 'El evento choca en horario con otro evento en la misma ubicación')
}

function aplicarErrorSimulado() {
  const tipo = consumirError()
  if (tipo === 'EVENTO_NO_EXISTE') fallar(404, 'El evento no existe')
  if (tipo === 'NO_DISPONIBLE') fallar(409, 'El evento no está disponible')
  if (tipo === 'YA_INSCRITO') fallar(409, 'Ya estás inscrito en este evento')
  if (tipo === 'LLENO') fallar(409, 'El evento está lleno')
  if (tipo === 'HORARIO') fallar(409, 'Tienes otra inscripción activa en este horario')
  if (tipo === 'SIN_MENSAJE') fallar(409)
  if (tipo === 'SERVIDOR') fallar(500)
}

function inscribir(usuario: UsuarioDb, eventoId: number): InscripcionDb {
  aplicarErrorSimulado()
  const db = obtenerDb()
  if (usuario.rol === 'ADMIN') fallar(403, 'Los administradores no pueden inscribirse')
  const evento = db.eventos.find((e) => e.id === eventoId) ?? fallar(404, 'El evento no existe')
  if (!evento.activo) fallar(409, 'El evento no está disponible')
  if (aFechaLocal(evento.fecha, evento.horaInicio) < ahora()) fallar(409, 'El evento ya comenzó')

  const existente = db.inscripciones.find((i) => i.usuarioId === usuario.id && i.eventoId === evento.id)
  if (existente?.estado === 'CONFIRMADA') fallar(409, 'Ya estás inscrito en este evento')

  const solapa = db.inscripciones.some((i) => {
    if (i.usuarioId !== usuario.id || i.estado !== 'CONFIRMADA') return false
    const otro = db.eventos.find((e) => e.id === i.eventoId)!
    return otro.activo && otro.fecha === evento.fecha && otro.horaInicio < evento.horaFin && otro.horaFin > evento.horaInicio
  })
  if (solapa) fallar(409, 'Tienes otra inscripción activa en este horario')
  if (confirmados(evento.id).length >= evento.cupo) fallar(409, 'El evento está lleno')

  const fechaInscripcion = format(ahora(), "yyyy-MM-dd'T'HH:mm:ss")
  if (existente) {
    existente.estado = 'CONFIRMADA'
    existente.fechaInscripcion = fechaInscripcion
    return existente
  }
  const nueva: InscripcionDb = {
    id: Math.max(0, ...db.inscripciones.map((i) => i.id)) + 1,
    usuarioId: usuario.id,
    eventoId: evento.id,
    estado: 'CONFIRMADA',
    fechaInscripcion,
  }
  db.inscripciones.push(nueva)
  return nueva
}

const url = (path: string) => `*/api${path}`

export const handlers = [
  http.post(
    url('/auth/login'),
    ruta(async ({ request }) => {
      const { email, password } = (await request.json()) as { email: string; password: string }
      const db = obtenerDb()
      const usuario = db.usuarios.find((u) => u.email === email && u.password === password)
      if (!usuario) fallar(401, 'Credenciales inválidas')
      db.sesion = usuario.email
      return HttpResponse.json(aPublico(usuario))
    }),
  ),
  http.post(
    url('/auth/registro'),
    ruta(async ({ request }) => {
      const { nombre, email, password } = (await request.json()) as { nombre: string; email: string; password: string }
      const db = obtenerDb()
      if (db.usuarios.some((u) => u.email === email)) fallar(409, 'El email ya está registrado')
      const usuario = { id: Math.max(...db.usuarios.map((u) => u.id)) + 1, nombre, email, password, rol: 'VISITANTE' as const }
      db.usuarios.push(usuario)
      return HttpResponse.json(aPublico(usuario), { status: 201 })
    }),
  ),
  http.post(
    url('/auth/logout'),
    ruta(() => {
      obtenerDb().sesion = null
      return new HttpResponse(null, { status: 200 })
    }),
  ),
  http.get(
    url('/auth/me'),
    ruta(() => {
      const usuario = usuarioActual()
      return HttpResponse.json({ ...aPublico(usuario), roles: [`ROLE_${usuario.rol}`] })
    }),
  ),

  http.get(
    url('/eventos'),
    ruta(({ request }) => {
      const usuario = usuarioActual()
      const p = new URL(request.url).searchParams
      const nombre = p.get('nombre')?.toLowerCase()
      const desde = p.get('desde')
      const hasta = p.get('hasta')
      const ubicacionId = p.get('ubicacionId')
      const lista = obtenerDb()
        .eventos.filter(
          (e) =>
            (usuario.rol === 'ADMIN' || e.activo) &&
            (!nombre || e.nombre.toLowerCase().includes(nombre)) &&
            (!desde || e.fecha >= desde) &&
            (!hasta || e.fecha <= hasta) &&
            (!ubicacionId || e.ubicacionId === Number(ubicacionId)),
        )
        .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))
      return HttpResponse.json(paginar(lista.map(aEvento), new URL(request.url)))
    }),
  ),
  http.get(
    url('/eventos/:id'),
    ruta(({ params }) => {
      const usuario = usuarioActual()
      const evento = buscarEvento(params.id)
      if (usuario.rol !== 'ADMIN' && !evento.activo) fallar(404, 'Evento no encontrado')
      return HttpResponse.json(aEvento(evento))
    }),
  ),
  http.post(
    url('/imagenes'),
    ruta(() => {
      exigirAdmin()
      return HttpResponse.json({ url: imagen(`subida-${crypto.randomUUID()}`) }, { status: 201 })
    }),
  ),
  http.post(
    url('/eventos'),
    ruta(async ({ request }) => {
      exigirAdmin()
      const i = (await request.json()) as EventoInput
      validarHorario(i)
      validarUbicacion(i)
      validarSolape(i)
      const db = obtenerDb()
      const nuevo: EventoDb = {
        id: Math.max(0, ...db.eventos.map((e) => e.id)) + 1,
        nombre: i.nombre.trim(),
        descripcion: i.descripcion ?? '',
        fecha: i.fecha,
        horaInicio: hora(i.horaInicio),
        horaFin: hora(i.horaFin),
        cupo: i.cupo,
        ubicacionId: i.ubicacionId,
        activo: true,
        imagenes: i.imagenes,
      }
      db.eventos.push(nuevo)
      return HttpResponse.json(aEvento(nuevo), { status: 201 })
    }),
  ),
  http.put(
    url('/eventos/:id'),
    ruta(async ({ params, request }) => {
      exigirAdmin()
      const evento = buscarEvento(params.id)
      if (!evento.activo) fallar(409, 'No se puede editar un evento cancelado')
      const i = (await request.json()) as EventoInput
      validarHorario(i)
      const inscritos = confirmados(evento.id).length
      const cambia =
        evento.fecha !== i.fecha ||
        evento.horaInicio !== hora(i.horaInicio) ||
        evento.horaFin !== hora(i.horaFin) ||
        evento.ubicacionId !== i.ubicacionId
      if (inscritos > 0 && cambia) {
        fallar(409, 'No se puede cambiar la fecha, hora o ubicación de un evento que ya tiene inscritos activos')
      }
      if (i.cupo < inscritos) fallar(409, `El nuevo cupo no puede ser menor que los inscritos actuales (${inscritos})`)
      validarUbicacion(i)
      validarSolape(i, evento.id)
      Object.assign(evento, { ...i, horaInicio: hora(i.horaInicio), horaFin: hora(i.horaFin), nombre: i.nombre.trim() })
      return HttpResponse.json(aEvento(evento))
    }),
  ),
  http.delete(
    url('/eventos/:id'),
    ruta(({ params }) => {
      exigirAdmin()
      const evento = buscarEvento(params.id)
      evento.activo = false
      confirmados(evento.id).forEach((i) => {
        i.estado = 'CANCELADA'
      })
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get(
    url('/eventos/:id/inscritos'),
    ruta(({ params, request }) => {
      exigirAdmin()
      const evento = buscarEvento(params.id)
      const lista = confirmados(evento.id).map((i) => {
        const u = obtenerDb().usuarios.find((x) => x.id === i.usuarioId)!
        return { usuarioId: u.id, nombre: u.nombre, email: u.email, fechaInscripcion: i.fechaInscripcion }
      })
      return HttpResponse.json(paginar(lista, new URL(request.url)))
    }),
  ),
  http.post(
    url('/eventos/:id/inscritos'),
    ruta(async ({ params, request }) => {
      exigirAdmin()
      const { usuarioId } = (await request.json()) as { usuarioId: number }
      const usuario = obtenerDb().usuarios.find((u) => u.id === usuarioId) ?? fallar(404, 'Usuario no encontrado')
      return HttpResponse.json(aInscripcion(inscribir(usuario, Number(params.id))), { status: 201 })
    }),
  ),
  http.delete(
    url('/eventos/:id/inscritos/:usuarioId'),
    ruta(({ params }) => {
      exigirAdmin()
      const i = confirmados(Number(params.id)).find((x) => x.usuarioId === Number(params.usuarioId))
      if (!i) fallar(404, 'Inscripción no encontrada')
      i.estado = 'CANCELADA'
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.post(
    url('/inscripciones'),
    ruta(async ({ request }) => {
      const { eventoId } = (await request.json()) as { eventoId: number }
      return HttpResponse.json(aInscripcion(inscribir(usuarioActual(), eventoId)), { status: 201 })
    }),
  ),
  http.get(
    url('/inscripciones/mias'),
    ruta(({ request }) => {
      const usuario = usuarioActual()
      const estado = new URL(request.url).searchParams.get('estado')
      const lista = obtenerDb().inscripciones.filter((i) => i.usuarioId === usuario.id && (!estado || i.estado === estado))
      return HttpResponse.json(paginar(lista.map(aInscripcion), new URL(request.url)))
    }),
  ),
  http.delete(
    url('/inscripciones/:id'),
    ruta(({ params }) => {
      const usuario = usuarioActual()
      const i = obtenerDb().inscripciones.find((x) => x.id === Number(params.id) && x.usuarioId === usuario.id)
      if (!i) fallar(404, 'Inscripción no encontrada')
      if (i.estado === 'CANCELADA') fallar(409, 'La inscripción ya está cancelada')
      i.estado = 'CANCELADA'
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get(
    url('/ubicaciones'),
    ruta(({ request }) => {
      const usuario = usuarioActual()
      const nombre = new URL(request.url).searchParams.get('nombre')?.toLowerCase()
      const lista = obtenerDb()
        .ubicaciones.filter((u) => (usuario.rol === 'ADMIN' || u.activo) && (!nombre || u.nombre.toLowerCase().includes(nombre)))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
      return HttpResponse.json(paginar(lista, new URL(request.url)))
    }),
  ),
  http.get(
    url('/ubicaciones/:id'),
    ruta(({ params }) => {
      const usuario = usuarioActual()
      const u = buscarUbicacion(params.id)
      if (usuario.rol !== 'ADMIN' && !u.activo) fallar(404, 'Ubicación no encontrada')
      return HttpResponse.json(u)
    }),
  ),
  http.post(
    url('/ubicaciones'),
    ruta(async ({ request }) => {
      exigirAdmin()
      const i = (await request.json()) as UbicacionInput
      const db = obtenerDb()
      if (db.ubicaciones.some((u) => u.nombre.toLowerCase() === i.nombre.trim().toLowerCase())) {
        fallar(409, 'Ya existe una ubicación con ese nombre')
      }
      const nueva = {
        id: Math.max(0, ...db.ubicaciones.map((u) => u.id)) + 1,
        nombre: i.nombre.trim(),
        descripcion: i.descripcion ?? null,
        direccion: i.direccion,
        capacidad: i.capacidad,
        activo: true,
        imagenPrincipal: i.imagenPrincipal ?? null,
        imagenes: i.imagenes ?? [],
      }
      db.ubicaciones.push(nueva)
      return HttpResponse.json(nueva, { status: 201 })
    }),
  ),
  http.put(
    url('/ubicaciones/:id'),
    ruta(async ({ params, request }) => {
      exigirAdmin()
      const u = buscarUbicacion(params.id)
      const i = (await request.json()) as UbicacionInput
      const repetido = obtenerDb().ubicaciones.some((x) => x.id !== u.id && x.nombre.toLowerCase() === i.nombre.trim().toLowerCase())
      if (repetido) fallar(409, 'Ya existe otra ubicación con ese nombre')
      Object.assign(u, {
        nombre: i.nombre.trim(),
        descripcion: i.descripcion ?? null,
        direccion: i.direccion,
        capacidad: i.capacidad,
        imagenPrincipal: i.imagenPrincipal ?? null,
        imagenes: i.imagenes ?? [],
      })
      return HttpResponse.json(u)
    }),
  ),
  http.delete(
    url('/ubicaciones/:id'),
    ruta(({ params }) => {
      exigirAdmin()
      const u = buscarUbicacion(params.id)
      const hoy = format(ahora(), 'yyyy-MM-dd')
      if (u.activo && obtenerDb().eventos.some((e) => e.ubicacionId === u.id && e.activo && e.fecha >= hoy)) {
        fallar(409, 'No se puede desactivar: la ubicación tiene eventos activos. Cancélalos o muévelos primero')
      }
      u.activo = false
      return new HttpResponse(null, { status: 204 })
    }),
  ),
  http.patch(
    url('/ubicaciones/:id/reactivar'),
    ruta(({ params }) => {
      exigirAdmin()
      const u = buscarUbicacion(params.id)
      u.activo = true
      return HttpResponse.json(u)
    }),
  ),

  http.get(
    url('/usuarios'),
    ruta(({ request }) => {
      exigirAdmin()
      return HttpResponse.json(paginar(obtenerDb().usuarios.map(aPublico), new URL(request.url)))
    }),
  ),
]
