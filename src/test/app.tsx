import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterAll, beforeAll, beforeEach, vi } from 'vitest'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth/AuthContext'
import { obtenerDb, reiniciarDb } from '@/mocks/db'
import { server } from '@/mocks/server'
import { simularError } from '@/mocks/simulador'
import { AppRoutes } from '@/routes'

export const AHORA = new Date(2026, 10, 7, 12, 0)

export function usarServidor() {
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
  afterAll(() => {
    server.close()
    vi.useRealTimers()
  })
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(AHORA)
    reiniciarDb(AHORA)
    simularError(null)
  })
}

export function entrarComo(rol: 'ADMIN' | 'VISITANTE') {
  obtenerDb().sesion = rol === 'ADMIN' ? 'admin@aforo.test' : 'visitante@aforo.test'
}

function Ruta() {
  const { pathname, search } = useLocation()
  return <output data-testid="ruta">{pathname + search}</output>
}

export function renderApp(ruta: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>
        <AuthProvider>
          <AppRoutes />
          <Ruta />
          <Toaster />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

export const rutaActual = () => screen.getByTestId('ruta').textContent
