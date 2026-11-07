import { useRef, useState } from 'react'
import { ArrowLeft, CalendarDays, MapPin, UserPlus, UsersRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { BotonConMotivo } from '@/components/BotonConMotivo'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EstadoError } from '@/components/EstadoError'
import { EstadoVacio } from '@/components/EstadoVacio'
import { Paginacion } from '@/components/Paginacion'
import { Sello } from '@/components/Sello'
import { CABECERA_APILADA, CELDA_APILADA, CUERPO_APILADO, FILA_APILADA, MARCO_TABLA } from '@/components/tablaApilada'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { mensajeInscripcion } from '@/features/inscripciones/mensajes'
import { useEvento, useInscritos, useRetirarInscrito } from '@/hooks/useEventos'
import { usePaginaValida } from '@/hooks/usePaginaValida'
import { formatoHorario, formatoRegistro } from '@/lib/fechas'
import { motivoBloqueo } from '@/lib/reglas'
import type { Inscrito } from '@/types'
import { AgregarAsistenteDialog } from './AgregarAsistenteDialog'

export function AsistentesPage() {
  const id = Number(useParams().id)
  const [page, setPage] = useState(0)
  const evento = useEvento(id)
  const inscritos = useInscritos(id, page)
  const retirar = useRetirarInscrito(id)
  const reubicando = usePaginaValida(inscritos.data, page, setPage)
  const [agregando, setAgregando] = useState(false)
  const [porRetirar, setPorRetirar] = useState<Inscrito | null>(null)
  const enviando = useRef(false)

  function confirmarRetiro() {
    if (!porRetirar || enviando.current) return
    enviando.current = true
    retirar.mutate(porRetirar.usuarioId, {
      onSuccess: () => toast.success('Asistente retirado'),
      onError: (error) => toast.error(mensajeInscripcion(error)),
      onSettled: () => {
        enviando.current = false
        setPorRetirar(null)
      },
    })
  }

  if (evento.isPending) {
    return (
      <div aria-label="Cargando evento" className="space-y-3">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48" />
      </div>
    )
  }
  if (evento.isError) {
    return <EstadoError error={evento.error} onRetry={() => evento.refetch()} porEstado={{ 404: 'El evento no está disponible' }} />
  }

  const e = evento.data

  return (
    <>
      <Link to="/admin/eventos" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a eventos
      </Link>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">{e.nombre}</h1>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            {formatoHorario(e)}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            {e.ubicacion.nombre}
          </p>
          <p className="tabular text-xl font-bold">
            {e.inscritos} / {e.cupo}
          </p>
        </div>
        <div className="md:max-w-64">
          <BotonConMotivo motivo={motivoBloqueo(e, { inscrito: false, ahora: new Date() })} onClick={() => setAgregando(true)}>
            <UserPlus className="mr-2 h-4 w-4" aria-hidden />
            Agregar asistente
          </BotonConMotivo>
        </div>
      </div>

      {inscritos.isPending || reubicando ? (
        <div aria-label="Cargando asistentes" className="space-y-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : inscritos.isError ? (
        <EstadoError error={inscritos.error} onRetry={() => inscritos.refetch()} />
      ) : inscritos.data.content.length === 0 ? (
        <EstadoVacio icono={UsersRound} titulo="Todavía no hay asistentes" descripcion="Las personas inscritas aparecerán aquí." />
      ) : (
        <>
          <div className={MARCO_TABLA}>
            <Table>
              <TableHeader className={CABECERA_APILADA}>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={CUERPO_APILADO}>
                {inscritos.data.content.map((i) => (
                  <TableRow key={i.usuarioId} className={FILA_APILADA}>
                    <TableCell className={`${CELDA_APILADA} font-semibold`}>{i.nombre}</TableCell>
                    <TableCell className={`${CELDA_APILADA} break-all`}>{i.email}</TableCell>
                    <TableCell className={`${CELDA_APILADA} tabular`}>{formatoRegistro(i.fechaInscripcion)}</TableCell>
                    <TableCell className={CELDA_APILADA}>
                      <Sello plano estado="Inscrito" />
                    </TableCell>
                    <TableCell className={`${CELDA_APILADA} md:text-right`}>
                      <Button variant="outline" size="sm" aria-label={`Retirar a ${i.nombre}`} onClick={() => setPorRetirar(i)}>
                        Retirar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Paginacion page={inscritos.data.number} totalPages={inscritos.data.totalPages} onChange={setPage} />
        </>
      )}

      <AgregarAsistenteDialog evento={e} open={agregando} onOpenChange={setAgregando} />
      <ConfirmDialog
        open={porRetirar !== null}
        onOpenChange={(abierto) => !abierto && setPorRetirar(null)}
        titulo="¿Retirar a esta persona?"
        descripcion={`${porRetirar?.nombre ?? 'Esta persona'} dejará de estar inscrita y se liberará su cupo.`}
        accion="Sí, retirar"
        onConfirm={confirmarRetiro}
        pendiente={retirar.isPending}
        destructivo
      />
    </>
  )
}
