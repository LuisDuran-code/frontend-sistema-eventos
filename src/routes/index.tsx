import { Route, Routes } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { ApiCaidaPage } from '@/features/auth/ApiCaidaPage'
import { useAuth } from '@/features/auth/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { NotFoundPage } from '@/features/NotFoundPage'
import { RedirigirInicio, RequireAuth, RequireRole } from './guards'

function Pendiente({ titulo }: { titulo: string }) {
  return <h1 className="text-4xl font-extrabold">{titulo}</h1>
}

export function AppRoutes() {
  const { cargando, apiCaida } = useAuth()

  if (cargando) {
    return (
      <div className="p-6" aria-label="Cargando">
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }
  if (apiCaida) return <ApiCaidaPage />

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<RedirigirInicio />} />
          <Route path="eventos" element={<Pendiente titulo="Eventos" />} />
          <Route element={<RequireRole role="VISITANTE" />}>
            <Route path="mis-inscripciones" element={<Pendiente titulo="Mis inscripciones" />} />
          </Route>
          <Route element={<RequireRole role="ADMIN" />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<RedirigirInicio />} />
              <Route path="eventos" element={<Pendiente titulo="Eventos" />} />
              <Route path="ubicaciones" element={<Pendiente titulo="Ubicaciones" />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
