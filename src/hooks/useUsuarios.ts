import { useQuery } from '@tanstack/react-query'
import { listarUsuarios } from '@/services/usuarios'
import { claves } from './queryKeys'

export function useUsuariosVisitantes() {
  return useQuery({
    queryKey: claves.usuarios,
    queryFn: async () => (await listarUsuarios(0, 50)).content.filter((u) => u.rol === 'VISITANTE'),
  })
}
