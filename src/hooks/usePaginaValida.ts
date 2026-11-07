import { useEffect } from 'react'
import type { Page } from '@/types'

// Al quitar la única fila de la última página, esa página deja de existir.
export function usePaginaValida(datos: Page<unknown> | undefined, page: number, setPage: (page: number) => void): boolean {
  const fueraDeRango = datos !== undefined && datos.content.length === 0 && page > 0
  const ultima = Math.max(0, (datos?.totalPages ?? 1) - 1)

  useEffect(() => {
    if (fueraDeRango) setPage(ultima)
  }, [fueraDeRango, ultima, setPage])

  return fueraDeRango
}
