import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { rutaInicial } from '@/lib/reglas'
import type { Rol } from '@/types'

export function RequireAuth() {
  const { sesion } = useAuth()
  return sesion ? <Outlet /> : <Navigate to="/login" replace />
}

export function RequireRole({ role }: { role: Rol }) {
  const { sesion } = useAuth()
  if (!sesion) return <Navigate to="/login" replace />
  return sesion.rol === role ? <Outlet /> : <Navigate to={rutaInicial(sesion.rol)} replace />
}

export function RedirigirInicio() {
  const { sesion } = useAuth()
  return <Navigate to={sesion ? rutaInicial(sesion.rol) : '/login'} replace />
}
