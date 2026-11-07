import { SearchX } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <EstadoVacio
      icono={SearchX}
      titulo="Página no encontrada"
      descripcion="La dirección no existe o ya no está disponible."
      accion={
        <Button asChild>
          <Link to="/">Ir al inicio</Link>
        </Button>
      }
    />
  )
}
