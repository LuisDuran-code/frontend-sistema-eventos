import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarEventos } from '@/services/eventos'
import {
  actualizarUbicacion,
  crearUbicacion,
  desactivarUbicacion,
  listarUbicaciones,
  obtenerUbicacion,
  reactivarUbicacion,
  type FiltrosUbicaciones,
} from '@/services/ubicaciones'
import type { UbicacionInput } from '@/types'
import { claves } from './queryKeys'

export function useUbicaciones(f: FiltrosUbicaciones = {}) {
  return useQuery({ queryKey: claves.listaUbicaciones(f), queryFn: () => listarUbicaciones(f), placeholderData: keepPreviousData })
}

export function useUbicacion(id: number | undefined) {
  return useQuery({ queryKey: claves.ubicacion(id ?? 0), queryFn: () => obtenerUbicacion(id!), enabled: id !== undefined })
}

function useInvalidar() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: claves.ubicaciones })
    qc.invalidateQueries({ queryKey: claves.eventos })
  }
}

export function useGuardarUbicacion() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: UbicacionInput }) =>
      id === undefined ? crearUbicacion(input) : actualizarUbicacion(id, input),
    onSuccess: invalidar,
  })
}

export function useCambiarActivaUbicacion() {
  const invalidar = useInvalidar()
  return useMutation({
    mutationFn: async ({ id, activa }: { id: number; activa: boolean }) => {
      if (activa) await reactivarUbicacion(id)
      else await desactivarUbicacion(id)
    },
    onSuccess: invalidar,
  })
}

export function useConteoEventos(ubicacionId: number) {
  return useQuery({
    queryKey: [...claves.eventos, 'conteo', ubicacionId],
    queryFn: async () => (await listarEventos({ ubicacionId, size: 1 })).totalElements,
  })
}
