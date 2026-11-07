import { api } from '@/lib/api'
import type { Page, Ubicacion, UbicacionInput } from '@/types'

export interface FiltrosUbicaciones {
  nombre?: string
  page?: number
  size?: number
}

export const listarUbicaciones = (f: FiltrosUbicaciones = {}) => api.get<Page<Ubicacion>>('/ubicaciones', { ...f })

export const obtenerUbicacion = (id: number) => api.get<Ubicacion>(`/ubicaciones/${id}`)

export const crearUbicacion = (input: UbicacionInput) => api.post<Ubicacion>('/ubicaciones', input)

export const actualizarUbicacion = (id: number, input: UbicacionInput) => api.put<Ubicacion>(`/ubicaciones/${id}`, input)

export const desactivarUbicacion = (id: number) => api.del(`/ubicaciones/${id}`)

export const reactivarUbicacion = (id: number) => api.patch<Ubicacion>(`/ubicaciones/${id}/reactivar`)
