import { api } from '@/lib/api'
import type { EstadoInscripcion, Inscripcion, Page } from '@/types'

export const inscribirse = (eventoId: number) => api.post<Inscripcion>('/inscripciones', { eventoId })

export const listarMias = (estado: EstadoInscripcion, page = 0, size = 10) =>
  api.get<Page<Inscripcion>>('/inscripciones/mias', { estado, page, size })

export const cancelarInscripcion = (id: number) => api.del(`/inscripciones/${id}`)
