import { useMemo } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelarInscripcion, inscribirse, listarMias } from '@/services/inscripciones'
import type { EstadoInscripcion } from '@/types'
import { claves } from './queryKeys'

export function useMias(estado: EstadoInscripcion, page: number, opciones: { size?: number; enabled?: boolean } = {}) {
  const size = opciones.size ?? 10
  return useQuery({
    queryKey: claves.listaMias(estado, page, size),
    queryFn: () => listarMias(estado, page, size),
    placeholderData: keepPreviousData,
    enabled: opciones.enabled ?? true,
  })
}

export function useMisInscripcionesActivas(habilitado: boolean) {
  const consulta = useMias('CONFIRMADA', 0, { size: 50, enabled: habilitado })
  const contenido = consulta.data?.content
  const porEvento = useMemo(() => new Map((contenido ?? []).map((i) => [i.evento.id, i])), [contenido])
  return { porEvento, cargando: consulta.isLoading }
}

function useInvalidar() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: claves.eventos })
    qc.invalidateQueries({ queryKey: claves.mias })
  }
}

export function useInscribirse() {
  const invalidar = useInvalidar()
  return useMutation({ mutationFn: (eventoId: number) => inscribirse(eventoId), onSuccess: invalidar })
}

export function useCancelarInscripcion() {
  const invalidar = useInvalidar()
  return useMutation({ mutationFn: (id: number) => cancelarInscripcion(id), onSuccess: invalidar })
}
