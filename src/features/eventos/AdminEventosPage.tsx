import { useEffect, useRef, useState } from 'react'
import { CalendarPlus, MoreHorizontal, Search, SearchX } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EstadoError } from '@/components/EstadoError'
import { EstadoVacio } from '@/components/EstadoVacio'
import { EventoForm } from '@/components/EventoForm'
import { Paginacion } from '@/components/Paginacion'
import { Sello } from '@/components/Sello'
import { CABECERA_APILADA, CELDA_APILADA, CUERPO_APILADO, FILA_APILADA, MARCO_TABLA } from '@/components/tablaApilada'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDebounce } from '@/hooks/useDebounce'
import { useCancelarEvento, useEventos } from '@/hooks/useEventos'
import { mensajeError } from '@/lib/api'
import { formatoHorario } from '@/lib/fechas'
import { motivoEdicionBloqueada, selloDeEvento } from '@/lib/reglas'
import type { Evento } from '@/types'

function avisoCancelacion(e: Evento | null): string {
  if (!e) return ''
  const inscripciones = e.inscritos === 1 ? 'su inscripción' : `sus ${e.inscritos} inscripciones`
  return `${e.nombre} quedará cancelado.${e.inscritos > 0 ? ` También se cancelarán ${inscripciones}.` : ''}`
}

export function AdminEventosPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? 0)
  const [texto, setTexto] = useState(q)
  const retrasado = useDebounce(texto)
  const eventos = useEventos({ nombre: q || undefined, page })
  const cancelar = useCancelarEvento()
  const [formulario, setFormulario] = useState<{ evento?: Evento } | null>(null)
  const [porCancelar, setPorCancelar] = useState<Evento | null>(null)
  const enviando = useRef(false)

  useEffect(() => {
    if (retrasado === q) return
    setParams(retrasado ? { q: retrasado } : {}, { replace: true })
    // Solo reacciona al texto ya estabilizado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retrasado])

  function cambiarPagina(nueva: number) {
    setParams({ ...(q && { q }), page: String(nueva) })
  }

  function confirmarCancelacion() {
    if (!porCancelar || enviando.current) return
    enviando.current = true
    cancelar.mutate(porCancelar.id, {
      onSuccess: () => toast.success('Evento cancelado'),
      onError: (error) => toast.error(mensajeError(error, {}, 'No se pudo cancelar el evento')),
      onSettled: () => {
        enviando.current = false
        setPorCancelar(null)
      },
    })
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight">Eventos</h1>
        <Button onClick={() => setFormulario({})}>
          <CalendarPlus className="mr-2 h-4 w-4" aria-hidden />
          Nuevo evento
        </Button>
      </div>
      <div className="relative mb-5 md:w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input aria-label="Buscar por nombre" placeholder="Buscar por nombre" className="bg-card pl-9" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>

      {eventos.isPending ? (
        <div aria-label="Cargando eventos" className="space-y-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : eventos.isError ? (
        <EstadoError error={eventos.error} onRetry={() => eventos.refetch()} />
      ) : eventos.data.content.length === 0 ? (
        <EstadoVacio
          icono={SearchX}
          titulo={q ? 'Ningún evento coincide con la búsqueda' : 'Todavía no hay eventos'}
          descripcion={q ? 'Prueba con otro nombre.' : 'Crea el primero con el botón Nuevo evento.'}
        />
      ) : (
        <>
          <div className={MARCO_TABLA}>
            <Table>
              <TableHeader className={CABECERA_APILADA}>
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Cupos</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={CUERPO_APILADO}>
                {eventos.data.content.map((e) => {
                  const sello = selloDeEvento(e, { inscrito: false, ahora: new Date() })
                  const motivo = motivoEdicionBloqueada(e)
                  const cancelado = e.estado === 'CANCELADO'
                  return (
                    <TableRow key={e.id} className={FILA_APILADA}>
                      <TableCell className={`${CELDA_APILADA} font-semibold`}>
                        <span className="mr-2">{e.nombre}</span>
                        {sello && <Sello plano estado={sello} />}
                      </TableCell>
                      <TableCell className={CELDA_APILADA}>{formatoHorario(e)}</TableCell>
                      <TableCell className={CELDA_APILADA}>{e.ubicacion.nombre}</TableCell>
                      <TableCell className={`${CELDA_APILADA} tabular whitespace-nowrap`}>
                        {e.inscritos} / {e.cupo}
                      </TableCell>
                      <TableCell className={`${CELDA_APILADA} md:text-right`}>
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label={`Acciones de ${e.nombre}`}>
                              <MoreHorizontal className="h-4 w-4" aria-hidden />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="max-w-64">
                            <DropdownMenuItem asChild>
                              <Link to={`/eventos/${e.id}`}>Ver</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled={motivo !== null} className="flex-col items-start gap-0.5" onSelect={() => setFormulario({ evento: e })}>
                              Editar
                              {motivo && <span className="text-xs">{motivo}</span>}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/eventos/${e.id}/asistentes`}>Gestionar asistentes</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={cancelado} className="text-destructive focus:text-destructive" onSelect={() => setPorCancelar(e)}>
                              Cancelar evento
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <Paginacion page={eventos.data.number} totalPages={eventos.data.totalPages} onChange={cambiarPagina} />
        </>
      )}

      <EventoForm evento={formulario?.evento} open={formulario !== null} onOpenChange={(abierto) => !abierto && setFormulario(null)} />
      <ConfirmDialog
        open={porCancelar !== null}
        onOpenChange={(abierto) => !abierto && setPorCancelar(null)}
        titulo="¿Cancelar este evento?"
        descripcion={avisoCancelacion(porCancelar)}
        accion="Sí, cancelar evento"
        onConfirm={confirmarCancelacion}
        pendiente={cancelar.isPending}
        destructivo
      />
    </>
  )
}
