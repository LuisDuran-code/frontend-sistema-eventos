export type Rol = 'ADMIN' | 'VISITANTE'
export type EstadoInscripcion = 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA'
export type EstadoEvento = 'PROGRAMADO' | 'CANCELADO'

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: Rol
}

export interface Sesion {
  email: string
  rol: Rol
  id?: number
  nombre?: string
}

export interface MeResponse {
  email: string
  roles?: string[]
  rol?: Rol
  id?: number
  nombre?: string
}

export interface UbicacionResumen {
  id: number
  nombre: string
  direccion: string
}

export interface Ubicacion {
  id: number
  nombre: string
  descripcion: string | null
  direccion: string
  capacidad: number
  activo: boolean
  imagenPrincipal: string | null
  imagenes: string[]
}

export interface UbicacionInput {
  nombre: string
  descripcion?: string
  direccion: string
  capacidad: number
  imagenPrincipal?: string
  imagenes: string[]
}

export interface Evento {
  id: number
  nombre: string
  descripcion: string | null
  fecha: string
  horaInicio: string
  horaFin: string
  cupo: number
  inscritos: number
  cuposDisponibles: number
  estado: EstadoEvento
  ubicacion: UbicacionResumen
}

export interface EventoInput {
  nombre: string
  descripcion?: string
  fecha: string
  horaInicio: string
  horaFin: string
  cupo: number
  ubicacionId: number
}

export interface EventoResumen {
  id: number
  nombre: string
  fecha: string
  horaInicio: string
  horaFin: string
  ubicacionNombre: string
}

export interface Inscripcion {
  id: number
  estado: EstadoInscripcion
  fechaInscripcion: string
  evento: EventoResumen
}

export interface Inscrito {
  usuarioId: number
  nombre: string
  email: string
  fechaInscripcion: string
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}
