import { api } from '@/lib/api'
import { todasLasPaginas } from '@/lib/paginas'
import type { Evento, EventoInput, Inscrito, Page } from '@/types'

export interface FiltrosEventos {
  nombre?: string
  desde?: string
  hasta?: string
  ubicacionId?: number
  page?: number
  size?: number
}

// Vercel y Railway no despliegan a la vez: la API puede ir por detrás y no enviar `imagenes`.
const conImagenes = (e: Evento): Evento => ({ ...e, imagenes: e.imagenes ?? [] })

export const listarEventos = async (f: FiltrosEventos = {}) => {
  const pagina = await api.get<Page<Evento>>('/eventos', { ...f, size: f.size ?? 12, sort: 'fecha,asc' })
  return { ...pagina, content: pagina.content.map(conImagenes) }
}

export const obtenerEvento = async (id: number) => conImagenes(await api.get<Evento>(`/eventos/${id}`))

export const crearEvento = (input: EventoInput) => api.post<Evento>('/eventos', input)

export const actualizarEvento = (id: number, input: EventoInput) => api.put<Evento>(`/eventos/${id}`, input)

export const cancelarEvento = (id: number) => api.del(`/eventos/${id}`)

export const listarInscritos = (id: number, page = 0, size?: number) =>
  api.get<Page<Inscrito>>(`/eventos/${id}/inscritos`, { page, size })

export const listarTodosLosInscritos = (id: number) => todasLasPaginas((page) => listarInscritos(id, page, 50))

export const agregarInscrito = (eventoId: number, usuarioId: number) =>
  api.post<unknown>(`/eventos/${eventoId}/inscritos`, { usuarioId })

export const retirarInscrito = (eventoId: number, usuarioId: number) => api.del(`/eventos/${eventoId}/inscritos/${usuarioId}`)
