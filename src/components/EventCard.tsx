import { Link } from 'react-router-dom'
import { formatoHorario } from '@/lib/fechas'
import { admiteInscripcion, haTerminado, type EstadoSello } from '@/lib/reglas'
import type { Evento } from '@/types'
import { CuposBadge } from './CuposBadge'
import { ImagenConPlaceholder } from './ImagenConPlaceholder'
import { Sello } from './Sello'

interface EventCardProps {
  evento: Evento
  imagen: string | null | undefined
  sello: EstadoSello | null
}

export function EventCard({ evento, imagen, sello }: EventCardProps) {
  const ahora = new Date()
  const enCurso = evento.estado === 'PROGRAMADO' && !admiteInscripcion(evento, ahora) && !haTerminado(evento, ahora)

  return (
    <Link to={`/eventos/${evento.id}`} className="group block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
      <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground transition-colors group-hover:border-primary">
          <div className="relative">
            <ImagenConPlaceholder src={imagen} alt="" className="aspect-[16/10] w-full" />
            {sello && <Sello estado={sello} className="absolute bottom-3 right-3" />}
          </div>
          <div className="flex flex-1 flex-col gap-1 p-4">
            <h2 className="mb-1 text-xl font-extrabold leading-tight">{evento.nombre}</h2>
            <p className="text-sm text-muted-foreground">{formatoHorario(evento)}</p>
            <p className="text-sm text-muted-foreground">{evento.ubicacion.nombre}</p>
            <div className="tabular mt-auto flex items-center justify-between pt-3">
              {admiteInscripcion(evento, ahora) ? (
                <CuposBadge disponibles={evento.cuposDisponibles} />
              ) : (
                <span className="text-sm font-semibold">{enCurso ? 'En curso' : null}</span>
              )}
              <span className="text-sm text-muted-foreground">
                {evento.inscritos} / {evento.cupo}
              </span>
            </div>
          </div>
      </article>
    </Link>
  )
}
