import { api } from '@/lib/api'
import type { MeResponse, Usuario } from '@/types'

export const login = (email: string, password: string) => api.post<Usuario>('/auth/login', { email, password })

export const logout = () => api.post<void>('/auth/logout')

export const getMe = () => api.get<MeResponse>('/auth/me')
