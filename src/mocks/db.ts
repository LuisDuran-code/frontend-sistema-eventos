import { addDays, format } from 'date-fns'
import type { EstadoInscripcion, Rol, Ubicacion } from '@/types'

export interface UsuarioDb {
  id: number
  nombre: string
  email: string
  password: string
  rol: Rol
}

export interface EventoDb {
  id: number
  nombre: string
  descripcion: string
  fecha: string
  horaInicio: string
  horaFin: string
  cupo: number
  ubicacionId: number
  activo: boolean
}

export interface InscripcionDb {
  id: number
  usuarioId: number
  eventoId: number
  estado: EstadoInscripcion
  fechaInscripcion: string
}

export interface Db {
  usuarios: UsuarioDb[]
  ubicaciones: Ubicacion[]
  eventos: EventoDb[]
  inscripciones: InscripcionDb[]
  sesion: string | null
}

const CLAVE = 'aforo-mock-db'
let db: Db
let relojFijo: Date | null = null

export function ahora(): Date {
  return relojFijo ?? new Date()
}

function imagen(semilla: string): string {
  return `https://picsum.photos/seed/aforo-${semilla}/800/500`
}

function ubicacion(id: number, nombre: string, direccion: string, capacidad: number, semilla: string | null, activo = true): Ubicacion {
  const imagenPrincipal = semilla === 'rota' ? 'https://imagen-rota.invalid/ubicacion.jpg' : semilla ? imagen(semilla) : null
  return {
    id,
    nombre,
    descripcion: `Espacio de ejemplo: ${nombre}.`,
    direccion,
    capacidad,
    activo,
    imagenPrincipal,
    imagenes: semilla && semilla !== 'rota' ? [imagen(`${semilla}-2`), imagen(`${semilla}-3`)] : [],
  }
}

function sembrar(hoy: Date): Db {
  const dia = (n: number) => format(addDays(hoy, n), 'yyyy-MM-dd')
  const registro = format(addDays(hoy, -2), "yyyy-MM-dd'T'09:30:00")
  const evento = (
    id: number,
    nombre: string,
    n: number,
    horaInicio: string,
    horaFin: string,
    cupo: number,
    ubicacionId: number,
    activo = true,
  ): EventoDb => ({
    id,
    nombre,
    descripcion: `Evento de ejemplo: ${nombre}. Los datos de esta demostración son sintéticos.`,
    fecha: dia(n),
    horaInicio,
    horaFin,
    cupo,
    ubicacionId,
    activo,
  })
  const inscripcion = (id: number, usuarioId: number, eventoId: number, estado: EstadoInscripcion = 'CONFIRMADA'): InscripcionDb => ({
    id,
    usuarioId,
    eventoId,
    estado,
    fechaInscripcion: registro,
  })

  return {
    sesion: null,
    usuarios: [
      { id: 1, nombre: 'Administración Aforo', email: 'admin@aforo.test', password: 'admin1234', rol: 'ADMIN' },
      { id: 2, nombre: 'Ana Ruiz', email: 'visitante@aforo.test', password: 'visitante1234', rol: 'VISITANTE' },
      { id: 3, nombre: 'Marta Rivas', email: 'marta@aforo.test', password: 'ejemplo1234', rol: 'VISITANTE' },
      { id: 4, nombre: 'Diego Flores', email: 'diego@aforo.test', password: 'ejemplo1234', rol: 'VISITANTE' },
      { id: 5, nombre: 'Lucía Campos', email: 'lucia@aforo.test', password: 'ejemplo1234', rol: 'VISITANTE' },
      { id: 6, nombre: 'Pablo Ortiz', email: 'pablo@aforo.test', password: 'ejemplo1234', rol: 'VISITANTE' },
    ],
    ubicaciones: [
      ubicacion(1, 'Auditorio Central', 'Av. Principal 120', 200, 'auditorio'),
      ubicacion(2, 'Sala Norte', 'Calle del Norte 8', 30, 'sala'),
      ubicacion(3, 'Plaza Mayor', 'Plaza Mayor s/n', 400, 'plaza'),
      ubicacion(4, 'Pabellón B', 'Recinto Ferial, nave B', 150, 'pabellon'),
      ubicacion(5, 'Biblioteca Municipal', 'Calle de los Libros 3', 25, 'biblioteca'),
      ubicacion(6, 'Teatro del Parque', 'Parque Central 1', 120, 'rota'),
      ubicacion(7, 'Jardín Botánico', 'Camino Verde 45', 80, 'jardin'),
      ubicacion(8, 'Salón Antiguo', 'Calle Vieja 2', 50, null, false),
    ],
    eventos: [
      evento(1, 'Taller de cerámica', 1, '14:00:00', '16:00:00', 30, 2),
      evento(2, 'Foro de empleo joven', 3, '09:00:00', '13:00:00', 200, 1),
      evento(3, 'Noche de cine al aire libre', 7, '19:30:00', '22:00:00', 400, 3),
      evento(4, 'Feria de ciencias', 1, '10:00:00', '14:00:00', 3, 4),
      evento(5, 'Club de lectura abierto', 11, '17:00:00', '18:30:00', 25, 5),
      evento(6, 'Concierto de cámara', 13, '18:00:00', '20:00:00', 120, 6),
      evento(7, 'Mercado de artesanos', 0, '00:01:00', '23:59:00', 80, 7),
      evento(8, 'Charla de astronomía', -1, '18:00:00', '19:30:00', 200, 1),
      evento(9, 'Jornada de voluntariado', 5, '08:00:00', '12:00:00', 60, 7, false),
      evento(10, 'Taller de fotografía', 1, '14:30:00', '15:30:00', 40, 6),
      evento(11, 'Recital de poesía', 9, '19:00:00', '20:30:00', 60, 6),
      evento(12, 'Encuentro de voluntarios', 15, '10:00:00', '12:00:00', 80, 7),
      evento(13, 'Maratón de ajedrez', 17, '09:00:00', '18:00:00', 100, 4),
      evento(14, 'Muestra de teatro escolar', 20, '16:00:00', '18:00:00', 120, 6),
    ],
    inscripciones: [
      inscripcion(1, 2, 1),
      inscripcion(2, 3, 1),
      inscripcion(3, 4, 1),
      inscripcion(4, 3, 4),
      inscripcion(5, 4, 4),
      inscripcion(6, 5, 4),
      inscripcion(7, 2, 5, 'CANCELADA'),
      inscripcion(8, 5, 2),
      inscripcion(9, 2, 8),
    ],
  }
}

function leerGuardada(): Db | null {
  try {
    const texto = sessionStorage.getItem(CLAVE)
    return texto ? (JSON.parse(texto) as Db) : null
  } catch {
    return null
  }
}

export function guardarDb() {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(db))
  } catch {
    // Sin almacenamiento, la demo sigue funcionando hasta recargar.
  }
}

export function reiniciarDb(fijo?: Date) {
  relojFijo = fijo ?? null
  db = sembrar(ahora())
  guardarDb()
}

export function obtenerDb(): Db {
  if (!db) db = leerGuardada() ?? sembrar(ahora())
  return db
}
