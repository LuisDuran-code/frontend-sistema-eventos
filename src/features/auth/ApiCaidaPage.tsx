import { Button } from '@/components/ui/button'
import { useAuth } from './AuthContext'

export function ApiCaidaPage() {
  const { reintentar } = useAuth()
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="max-w-lg space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">No se puede conectar con la API</h1>
        <p>Comprueba que el backend esté encendido. Si está en otra dirección, ajusta <code>VITE_PROXY_TARGET</code> en tu archivo <code>.env</code>.</p>
        <p>
          Para usar la app sin backend, agrega <code>VITE_USE_MOCKS=true</code> a <code>.env</code> y reinicia <code>npm run dev</code>.
        </p>
        <Button onClick={reintentar}>Reintentar</Button>
      </div>
    </main>
  )
}
