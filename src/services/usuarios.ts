import { api } from '@/lib/api'
import type { Page, Usuario } from '@/types'

export const listarUsuarios = (page = 0, size = 50) => api.get<Page<Usuario>>('/usuarios', { page, size })
