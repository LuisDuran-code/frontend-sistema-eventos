import { useEffect, useState } from 'react'

export function useDebounce<T>(valor: T, ms = 300): T {
  const [retrasado, setRetrasado] = useState(valor)

  useEffect(() => {
    const id = setTimeout(() => setRetrasado(valor), ms)
    return () => clearTimeout(id)
  }, [valor, ms])

  return retrasado
}
