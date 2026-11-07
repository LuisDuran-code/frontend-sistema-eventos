import type { Page } from '@/types'

// La API recorta `size` a 50 sin avisar, así que una lista completa exige recorrer páginas.
export async function todasLasPaginas<T>(pedir: (page: number) => Promise<Page<T>>): Promise<T[]> {
  const primera = await pedir(0)
  const resto = await Promise.all(Array.from({ length: Math.max(0, primera.totalPages - 1) }, (_, i) => pedir(i + 1)))
  return [primera, ...resto].flatMap((p) => p.content)
}
