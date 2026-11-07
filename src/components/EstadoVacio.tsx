import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface EstadoVacioProps {
  icono: LucideIcon
  titulo: string
  descripcion?: string
  accion?: ReactNode
}

export function EstadoVacio({ icono: Icono, titulo, descripcion, accion }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed bg-card px-6 py-14 text-center">
      <Icono className="h-10 w-10 text-primary" aria-hidden />
      <h2 className="text-lg font-bold">{titulo}</h2>
      {descripcion && <p className="max-w-md text-muted-foreground">{descripcion}</p>}
      {accion}
    </div>
  )
}
