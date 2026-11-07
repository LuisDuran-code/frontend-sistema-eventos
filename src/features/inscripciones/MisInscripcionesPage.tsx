import { useRef, useState } from 'react'
import { CalendarCheck, CalendarOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EstadoError } from '@/components/EstadoError'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Paginacion } from '@/components/Paginacion'
import { Sello } from '@/components/Sello'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCancelarInscripcion, useMias } from '@/hooks/useInscripciones'
import { mensajeError } from '@/lib/api'
import { formatoHorario } from '@/lib/fechas'
import type { EstadoInscripcion, Inscripcion } from '@/types'

const CELDA = 'block px-0 py-1 md:table-cell md:px-2 md:py-3'

function TablaInscripciones({ estado }: { estado: EstadoInscripcion }) {
  const [page, setPage] = useState(0)
  const [porCancelar, setPorCancelar] = useState<Inscripcion | null>(null)
  const consulta = useMias(estado, page)
  const cancelar = useCancelarInscripcion()
  const enviando = useRef(false)
  const activas = estado === 'CONFIRMADA'

  function confirmar() {
    if (!porCancelar || enviando.current) return
    enviando.current = true
    cancelar.mutate(porCancelar.id, {
      onSuccess: () => toast.success('Cancelaste tu asistencia'),
      onError: (error) => toast.error(mensajeError(error, {}, 'No se pudo cancelar la asistencia')),
      onSettled: () => {
        enviando.current = false
        setPorCancelar(null)
      },
    })
  }

  if (consulta.isPending) {
    return (
      <div aria-label="Cargando inscripciones" className="space-y-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    )
  }
  if (consulta.isError) return <EstadoError error={consulta.error} onRetry={() => consulta.refetch()} />
  if (consulta.data.content.length === 0) {
    return activas ? (
      <EstadoVacio
        icono={CalendarCheck}
        titulo="No tienes inscripciones activas"
        descripcion="Cuando te inscribas en un evento, aparecerá aquí."
        accion={
          <Button asChild>
            <Link to="/eventos">Ver eventos</Link>
          </Button>
        }
      />
    ) : (
      <EstadoVacio icono={CalendarOff} titulo="No tienes inscripciones canceladas" />
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-card px-4 md:px-2">
        <Table>
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Estado</TableHead>
              {activas && <TableHead><span className="sr-only">Acciones</span></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:last-child]:border-b-0">
            {consulta.data.content.map((i) => (
              <TableRow key={i.id} className="block py-3 md:table-row md:py-0">
                <TableCell className={`${CELDA} font-semibold`}>
                  <Link to={`/eventos/${i.evento.id}`} className="underline-offset-4 hover:underline">
                    {i.evento.nombre}
                  </Link>
                </TableCell>
                <TableCell className={CELDA}>{formatoHorario(i.evento)}</TableCell>
                <TableCell className={CELDA}>{i.evento.ubicacionNombre}</TableCell>
                <TableCell className={CELDA}>
                  <Sello plano estado={activas ? 'Inscrito' : 'Cancelada'} />
                </TableCell>
                {activas && (
                  <TableCell className={`${CELDA} md:text-right`}>
                    <Button variant="outline" size="sm" onClick={() => setPorCancelar(i)}>
                      Cancelar asistencia
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Paginacion page={consulta.data.number} totalPages={consulta.data.totalPages} onChange={setPage} />
      <ConfirmDialog
        open={porCancelar !== null}
        onOpenChange={(abierto) => !abierto && setPorCancelar(null)}
        titulo="¿Cancelar tu asistencia?"
        descripcion={`Liberarás tu cupo en ${porCancelar?.evento.nombre ?? 'este evento'}.`}
        accion="Sí, cancelar"
        onConfirm={confirmar}
        pendiente={cancelar.isPending}
        destructivo
      />
    </>
  )
}

export function MisInscripcionesPage() {
  return (
    <>
      <h1 className="mb-5 text-4xl font-extrabold tracking-tight">Mis inscripciones</h1>
      <Tabs defaultValue="activas">
        <TabsList className="mb-4">
          <TabsTrigger value="activas">Activas</TabsTrigger>
          <TabsTrigger value="canceladas">Canceladas</TabsTrigger>
        </TabsList>
        <TabsContent value="activas">
          <TablaInscripciones estado="CONFIRMADA" />
        </TabsContent>
        <TabsContent value="canceladas">
          <TablaInscripciones estado="CANCELADA" />
        </TabsContent>
      </Tabs>
    </>
  )
}
