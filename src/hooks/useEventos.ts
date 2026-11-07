import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  actualizarEvento,
  agregarInscrito,
  cancelarEvento,
  crearEvento,
  listarEventos,
  listarInscritos,
  obtenerEvento,
  retirarInscrito,
  type FiltrosEventos,
} from '@/services/eventos'
import type { EventoInput } from '@/types'
import { claves } from './queryKeys'

export function useEventos(f: FiltrosEventos) {
  return useQuery({ queryKey: claves.listaEventos(f), queryFn: () => listarEventos(f), placeholderData: keepPreviousData })
}

export function useEvento(id: number) {
  return useQuery({ queryKey: claves.evento(id), queryFn: () => obtenerEvento(id) })
}

function useInvalidarInscripciones() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: claves.eventos })
    qc.invalidateQueries({ queryKey: claves.mias })
  }
}

export function useCrearEvento() {
  const invalidar = useInvalidarInscripciones()
  return useMutation({ mutationFn: (input: EventoInput) => crearEvento(input), onSuccess: invalidar })
}

export function useActualizarEvento() {
  const invalidar = useInvalidarInscripciones()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: EventoInput }) => actualizarEvento(id, input),
    onSuccess: invalidar,
  })
}

export function useCancelarEvento() {
  const invalidar = useInvalidarInscripciones()
  return useMutation({ mutationFn: (id: number) => cancelarEvento(id), onSuccess: invalidar })
}

export function useInscritos(id: number, page: number, size?: number) {
  return useQuery({ queryKey: claves.inscritos(id, page, size), queryFn: () => listarInscritos(id, page, size), placeholderData: keepPreviousData })
}

export function useAgregarInscrito(eventoId: number) {
  const invalidar = useInvalidarInscripciones()
  return useMutation({ mutationFn: (usuarioId: number) => agregarInscrito(eventoId, usuarioId), onSuccess: invalidar })
}

export function useRetirarInscrito(eventoId: number) {
  const invalidar = useInvalidarInscripciones()
  return useMutation({ mutationFn: (usuarioId: number) => retirarInscrito(eventoId, usuarioId), onSuccess: invalidar })
}
