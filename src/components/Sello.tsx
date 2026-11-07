import type { EstadoSello } from '@/lib/reglas'
import { cn } from '@/lib/utils'

const COLOR: Record<EstadoSello, string> = {
  Inscrito: 'text-success',
  Lleno: 'text-destructive',
  Cancelado: 'text-destructive',
  Cancelada: 'text-destructive',
  Finalizado: 'text-foreground',
}

interface SelloProps {
  estado: EstadoSello
  animar?: boolean
  plano?: boolean
  className?: string
}

export function Sello({ estado, animar, plano, className }: SelloProps) {
  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-md border-[3px] border-current bg-card font-sello font-bold uppercase leading-none tracking-[.06em]',
        plano ? 'border-2 px-2 py-1 text-sm' : '-rotate-6 px-3 py-1.5 text-2xl',
        animar && !plano && 'animate-sello-cae motion-reduce:animate-none',
        COLOR[estado],
        className,
      )}
    >
      {estado}
    </span>
  )
}
