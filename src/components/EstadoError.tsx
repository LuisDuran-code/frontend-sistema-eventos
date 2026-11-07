import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mensajeError } from '@/lib/api'
import { EstadoVacio } from './EstadoVacio'

interface EstadoErrorProps {
  error: unknown
  onRetry: () => void
  porEstado?: Partial<Record<number, string>>
}

export function EstadoError({ error, onRetry, porEstado = {} }: EstadoErrorProps) {
  return (
    <EstadoVacio
      icono={TriangleAlert}
      titulo="No se pudo cargar la información"
      descripcion={mensajeError(error, porEstado, 'Revisa tu conexión e inténtalo de nuevo.')}
      accion={<Button onClick={onRetry}>Reintentar</Button>}
    />
  )
}
