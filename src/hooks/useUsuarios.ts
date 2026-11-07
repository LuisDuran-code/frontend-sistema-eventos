import { useQuery } from '@tanstack/react-query'
import { listarTodosLosUsuarios } from '@/services/usuarios'
import { claves } from './queryKeys'

export function useUsuariosVisitantes() {
  return useQuery({
    queryKey: claves.usuarios,
    queryFn: async () => (await listarTodosLosUsuarios()).filter((u) => u.rol === 'VISITANTE'),
  })
}
