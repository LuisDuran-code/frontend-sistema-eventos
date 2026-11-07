import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { esApiCaida } from '@/lib/api'
import { aSesion } from '@/lib/reglas'
import { getMe, login, logout } from '@/services/auth'
import type { Sesion } from '@/types'

interface AuthValor {
  sesion: Sesion | null
  cargando: boolean
  apiCaida: boolean
  iniciarSesion: (email: string, password: string) => Promise<Sesion>
  cerrarSesion: () => Promise<void>
  reintentar: () => void
}

const AuthContext = createContext<AuthValor | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [apiCaida, setApiCaida] = useState(false)

  const consultar = useCallback(async () => {
    setCargando(true)
    setApiCaida(false)
    try {
      setSesion(aSesion(await getMe()))
    } catch (error) {
      setSesion(null)
      setApiCaida(esApiCaida(error))
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    consultar()
  }, [consultar])

  const iniciarSesion = useCallback(async (email: string, password: string) => {
    const nueva = aSesion(await login(email, password))
    setSesion(nueva)
    return nueva
  }, [])

  const cerrarSesion = useCallback(async () => {
    await logout()
    queryClient.clear()
    setSesion(null)
  }, [queryClient])

  const valor = useMemo(
    () => ({ sesion, cargando, apiCaida, iniciarSesion, cerrarSesion, reintentar: consultar }),
    [sesion, cargando, apiCaida, iniciarSesion, cerrarSesion, consultar],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValor {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth requiere AuthProvider')
  return valor
}
