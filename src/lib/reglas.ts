import type { Evento, MeResponse, Rol, Sesion } from '@/types'
import { aFechaLocal } from './fechas'

export type EstadoSello = 'Inscrito' | 'Lleno' | 'Finalizado' | 'Cancelado' | 'Cancelada'

type TiempoEvento = Pick<Evento, 'fecha' | 'horaInicio' | 'horaFin'>

interface Contexto {
  inscrito: boolean
  ahora: Date
}

export function haComenzado(e: TiempoEvento, ahora: Date): boolean {
  return aFechaLocal(e.fecha, e.horaInicio) <= ahora
}

export function haTerminado(e: TiempoEvento, ahora: Date): boolean {
  return aFechaLocal(e.fecha, e.horaFin) <= ahora
}

export function motivoBloqueo(e: Evento, { inscrito, ahora }: Contexto): string | null {
  if (e.estado === 'CANCELADO') return 'Este evento fue cancelado'
  if (haTerminado(e, ahora)) return 'El evento ya terminó'
  if (haComenzado(e, ahora)) return 'El evento ya comenzó'
  if (inscrito) return 'Ya estás inscrito en este evento'
  if (e.cuposDisponibles <= 0) return 'El evento está lleno'
  return null
}

export function selloDeEvento(e: Evento, { inscrito, ahora }: Contexto): EstadoSello | null {
  if (e.estado === 'CANCELADO') return 'Cancelado'
  if (haTerminado(e, ahora)) return 'Finalizado'
  if (inscrito) return 'Inscrito'
  if (e.cuposDisponibles <= 0) return 'Lleno'
  return null
}

export function motivoEdicionBloqueada(e: Evento, ahora = new Date()): string | null {
  if (e.estado === 'CANCELADO') return 'No se puede editar un evento cancelado'
  // La API exige horario futuro al editar y, con inscritos, no deja cambiarlo.
  if (e.inscritos > 0 && haComenzado(e, ahora)) return 'Ya comenzó y tiene inscritos'
  return null
}

export function aSesion(me: MeResponse): Sesion {
  const rol = me.rol ?? (me.roles?.includes('ROLE_ADMIN') ? 'ADMIN' : 'VISITANTE')
  return {
    email: me.email,
    rol,
    ...(me.id !== undefined && { id: me.id }),
    ...(me.nombre !== undefined && { nombre: me.nombre }),
  }
}

export function rutaInicial(rol: Rol): string {
  return rol === 'ADMIN' ? '/admin/eventos' : '/eventos'
}
