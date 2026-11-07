import { Route, Routes } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AppLayout } from '@/components/layout/AppLayout'
import { AsistentesPage } from '@/features/asistentes/AsistentesPage'
import { ApiCaidaPage } from '@/features/auth/ApiCaidaPage'
import { useAuth } from '@/features/auth/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { AdminEventosPage } from '@/features/eventos/AdminEventosPage'
import { EventoDetallePage } from '@/features/eventos/EventoDetallePage'
import { EventosPage } from '@/features/eventos/EventosPage'
import { MisInscripcionesPage } from '@/features/inscripciones/MisInscripcionesPage'
import { NotFoundPage } from '@/features/NotFoundPage'
import { UbicacionesPage } from '@/features/ubicaciones/UbicacionesPage'
import { RedirigirInicio, RequireAuth, RequireRole } from './guards'


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
          <Route path="eventos" element={<EventosPage />} />
          <Route path="eventos/:id" element={<EventoDetallePage />} />
          <Route element={<RequireRole role="VISITANTE" />}>
            <Route path="mis-inscripciones" element={<MisInscripcionesPage />} />
          </Route>
          <Route element={<RequireRole role="ADMIN" />}>
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<RedirigirInicio />} />
              <Route path="eventos" element={<AdminEventosPage />} />
              <Route path="eventos/:id/asistentes" element={<AsistentesPage />} />
              <Route path="ubicaciones" element={<UbicacionesPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
