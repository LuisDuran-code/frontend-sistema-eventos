import { useMemo } from 'react'
import { useUbicaciones } from './useUbicaciones'

export function useImagenesUbicacion(): Map<number, string | null> {
  const { data } = useUbicaciones({ size: 50 })
  return useMemo(() => new Map((data?.content ?? []).map((u) => [u.id, u.imagenPrincipal])), [data])
}
