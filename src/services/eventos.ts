import { api } from '@/lib/api'
import type { Evento, EventoInput, Inscrito, Page } from '@/types'

export interface FiltrosEventos {
  nombre?: string
  desde?: string
  hasta?: string
  ubicacionId?: number
  page?: number
  size?: number
}

export const listarEventos = (f: FiltrosEventos = {}) =>
  api.get<Page<Evento>>('/eventos', { ...f, size: f.size ?? 12, sort: 'fecha,asc' })

export const obtenerEvento = (id: number) => api.get<Evento>(`/eventos/${id}`)

export const crearEvento = (input: EventoInput) => api.post<Evento>('/eventos', input)

export const actualizarEvento = (id: number, input: EventoInput) => api.put<Evento>(`/eventos/${id}`, input)

export const cancelarEvento = (id: number) => api.del(`/eventos/${id}`)

export const listarInscritos = (id: number, page = 0) => api.get<Page<Inscrito>>(`/eventos/${id}/inscritos`, { page })

export const agregarInscrito = (eventoId: number, usuarioId: number) =>
  api.post<unknown>(`/eventos/${eventoId}/inscritos`, { usuarioId })

export const retirarInscrito = (eventoId: number, usuarioId: number) => api.del(`/eventos/${eventoId}/inscritos/${usuarioId}`)
