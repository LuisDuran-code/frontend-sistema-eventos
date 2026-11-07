import type { FiltrosEventos } from '@/services/eventos'
import type { FiltrosUbicaciones } from '@/services/ubicaciones'
import type { EstadoInscripcion } from '@/types'

export const claves = {
  eventos: ['eventos'] as const,
  listaEventos: (f: FiltrosEventos) => ['eventos', 'lista', f] as const,
  evento: (id: number) => ['eventos', 'detalle', id] as const,
  inscritos: (id: number, page: number) => ['eventos', 'inscritos', id, page] as const,
  mias: ['mias'] as const,
  listaMias: (estado: EstadoInscripcion, page: number, size: number) => ['mias', estado, page, size] as const,
  ubicaciones: ['ubicaciones'] as const,
  listaUbicaciones: (f: FiltrosUbicaciones) => ['ubicaciones', 'lista', f] as const,
  ubicacion: (id: number) => ['ubicaciones', 'detalle', id] as const,
  usuarios: ['usuarios'] as const,
}
