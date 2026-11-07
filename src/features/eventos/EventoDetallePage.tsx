import { useState } from 'react'
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EstadoError } from '@/components/EstadoError'
import { Sello } from '@/components/Sello'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/AuthContext'
import { AccionesEvento } from '@/features/inscripciones/AccionesEvento'
import { useEvento } from '@/hooks/useEventos'
import { useMisInscripcionesActivas } from '@/hooks/useInscripciones'
import { useUbicacion } from '@/hooks/useUbicaciones'
import { formatoHorario } from '@/lib/fechas'
import { admiteInscripcion, selloDeEvento } from '@/lib/reglas'
import { GaleriaEvento } from './GaleriaEvento'

export function EventoDetallePage() {
  const id = Number(useParams().id)
  const { sesion } = useAuth()
  const evento = useEvento(id)
  const ubicacion = useUbicacion(evento.data?.ubicacion.id)
  const { porEvento } = useMisInscripcionesActivas(sesion?.rol === 'VISITANTE')
  const [cuposAlConfirmar, setCuposAlConfirmar] = useState<number | null>(null)

  if (evento.isPending) {
    return (
      <div aria-label="Cargando evento" className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-[16/10] rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }
  if (evento.isError) {
    return <EstadoError error={evento.error} onRetry={() => evento.refetch()} porEstado={{ 404: 'El evento no está disponible' }} />
  }

  const e = evento.data
  const inscripcion = porEvento.get(e.id)
  const sello = selloDeEvento(e, { inscrito: Boolean(inscripcion), ahora: new Date() })
  const porcentaje = e.cupo > 0 ? Math.round((e.inscritos / e.cupo) * 100) : 0

  const n = e.cuposDisponibles
  const restantes = n === 0 ? 'Sin cupos' : n === 1 ? 'Queda 1 cupo' : `Quedan ${n} cupos`

  const principalUbicacion = ubicacion.data?.imagenPrincipal
  const imagenes = e.imagenes.length > 0 ? e.imagenes : principalUbicacion ? [principalUbicacion] : []

  return (
    <>
      <Link to="/eventos" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a eventos
      </Link>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <GaleriaEvento imagenes={imagenes} alt={`Imagen de ${e.nombre}`}>
          {sello && <Sello estado={sello} animar={cuposAlConfirmar !== null} className="absolute bottom-4 right-4" />}
        </GaleriaEvento>
        <div className="space-y-5">
          <h1 className="text-4xl font-extrabold tracking-tight">{e.nombre}</h1>
          <ul className="space-y-2">
            <li className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>{formatoHorario(e)}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <span>
                {e.ubicacion.nombre}, {e.ubicacion.direccion}
              </span>
            </li>
            {ubicacion.data && (
              <li className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span>Capacidad del lugar: {ubicacion.data.capacidad} personas</span>
              </li>
            )}
          </ul>
          <div className="space-y-2">
            <div className="tabular flex justify-between text-sm font-semibold">
              <span>Cupos ocupados</span>
              <span>
                {e.inscritos} / {e.cupo}
              </span>
            </div>
            <Progress value={porcentaje} aria-label="Cupos ocupados" />
            {admiteInscripcion(e, new Date()) && (
              <p key={n} className={`tabular text-lg font-bold ${cuposAlConfirmar !== null && n !== cuposAlConfirmar ? 'animate-dato-cambia motion-reduce:animate-none' : ''}`}>
                {restantes}
              </p>
            )}
          </div>
          <AccionesEvento evento={e} inscrito={Boolean(inscripcion)} onInscrito={() => setCuposAlConfirmar(n)} />
          {e.descripcion && <p className="max-w-prose whitespace-pre-line">{e.descripcion}</p>}
        </div>
      </div>
    </>
  )
}
