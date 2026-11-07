import { api } from '@/lib/api'
import { todasLasPaginas } from '@/lib/paginas'
import type { Page, Usuario } from '@/types'

export const listarUsuarios = (page = 0, size = 50) => api.get<Page<Usuario>>('/usuarios', { page, size })

export const listarTodosLosUsuarios = () => todasLasPaginas((page) => listarUsuarios(page))
