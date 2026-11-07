import { CalendarX, SearchX } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { EstadoError } from '@/components/EstadoError'
import { EstadoVacio } from '@/components/EstadoVacio'
import { EventCard } from '@/components/EventCard'
import { Paginacion } from '@/components/Paginacion'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/AuthContext'
import { useEventos } from '@/hooks/useEventos'
import { useImagenesUbicacion } from '@/hooks/useImagenesUbicacion'
import { useMisInscripcionesActivas } from '@/hooks/useInscripciones'
import { useUbicaciones } from '@/hooks/useUbicaciones'
import { selloDeEvento } from '@/lib/reglas'
import { FiltrosEventos, type ValoresFiltros } from './FiltrosEventos'

const COLUMNAS = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

export function EventosPage() {
  const { sesion } = useAuth()
  const [params, setParams] = useSearchParams()
  const valores: ValoresFiltros = {
    q: params.get('q') ?? '',
    ubicacion: params.get('ubicacion') ?? '',
    desde: params.get('desde') ?? '',
    hasta: params.get('hasta') ?? '',
  }
  const page = Number(params.get('page') ?? 0)

  const eventos = useEventos({
    nombre: valores.q || undefined,
    ubicacionId: valores.ubicacion ? Number(valores.ubicacion) : undefined,
    desde: valores.desde || undefined,
    hasta: valores.hasta || undefined,
    page,
  })
  const ubicaciones = useUbicaciones({ size: 50 })
  const imagenes = useImagenesUbicacion()
  const { porEvento } = useMisInscripcionesActivas(sesion?.rol === 'VISITANTE')

  function cambiarFiltros(cambios: Partial<ValoresFiltros>) {
    setParams(
      (actual) => {
        const siguiente = new URLSearchParams(actual)
        siguiente.delete('page')
        Object.entries(cambios).forEach(([clave, valor]) => (valor ? siguiente.set(clave, valor) : siguiente.delete(clave)))
        return siguiente
      },
      { replace: true },
    )
  }

  function cambiarPagina(nueva: number) {
    setParams((actual) => {
      const siguiente = new URLSearchParams(actual)
      if (nueva === 0) siguiente.delete('page')
      else siguiente.set('page', String(nueva))
      return siguiente
    })
  }

  const hayFiltros = Boolean(valores.q || valores.ubicacion || valores.desde)
  const ahora = new Date()

  return (
    <>
      <h1 className="mb-5 text-4xl font-extrabold tracking-tight">Eventos</h1>
      <FiltrosEventos valores={valores} ubicaciones={ubicaciones.data?.content ?? []} onChange={cambiarFiltros} onLimpiar={() => setParams({}, { replace: true })} />

      {eventos.isPending && (
        <div className={COLUMNAS} aria-label="Cargando eventos">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      )}
      {eventos.isError && <EstadoError error={eventos.error} onRetry={() => eventos.refetch()} />}
      {eventos.data?.content.length === 0 &&
        (hayFiltros ? (
          <EstadoVacio icono={SearchX} titulo="No hay eventos con esos filtros" descripcion="Prueba con otro título, ubicación o rango de fechas." />
        ) : (
          <EstadoVacio icono={CalendarX} titulo="Aún no hay eventos" descripcion="Cuando se publiquen, aparecerán aquí." />
        ))}
      {!eventos.isError && eventos.data && eventos.data.content.length > 0 && (
        <>
          <div className={COLUMNAS}>
            {eventos.data.content.map((evento) => (
              <EventCard
                key={evento.id}
                evento={evento}
                imagen={imagenes.get(evento.ubicacion.id)}
                sello={selloDeEvento(evento, { inscrito: porEvento.has(evento.id), ahora })}
              />
            ))}
          </div>
          <Paginacion page={eventos.data.number} totalPages={eventos.data.totalPages} onChange={cambiarPagina} />
        </>
      )}
    </>
  )
}
