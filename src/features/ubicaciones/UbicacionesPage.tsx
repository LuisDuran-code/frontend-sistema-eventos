import { useRef, useState } from 'react'
import { MapPin, MapPinPlus } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EstadoError } from '@/components/EstadoError'
import { EstadoVacio } from '@/components/EstadoVacio'
import { mensajeActivacion } from '@/components/mensajesUbicacion'
import { Paginacion } from '@/components/Paginacion'
import { CABECERA_APILADA, CELDA_APILADA, CUERPO_APILADO, FILA_APILADA, MARCO_TABLA } from '@/components/tablaApilada'
import { UbicacionForm } from '@/components/UbicacionForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCambiarActivaUbicacion, useConteoEventos, useUbicaciones } from '@/hooks/useUbicaciones'
import type { Ubicacion } from '@/types'

function ConteoEventos({ ubicacionId }: { ubicacionId: number }) {
  const conteo = useConteoEventos(ubicacionId)
  if (conteo.data === undefined) return <span className="text-muted-foreground">—</span>
  return (
    <span className="tabular" aria-label={conteo.data === 1 ? '1 evento' : `${conteo.data} eventos`}>
      {conteo.data}
    </span>
  )
}

export function UbicacionesPage() {
  const [page, setPage] = useState(0)
  const ubicaciones = useUbicaciones({ page })
  const cambiarActiva = useCambiarActivaUbicacion()
  const [formulario, setFormulario] = useState<{ ubicacion?: Ubicacion } | null>(null)
  const [porDesactivar, setPorDesactivar] = useState<Ubicacion | null>(null)
  const enviando = useRef(false)

  function cambiar(u: Ubicacion, activa: boolean) {
    if (enviando.current) return
    enviando.current = true
    cambiarActiva.mutate(
      { id: u.id, activa },
      {
        onSuccess: () => toast.success(activa ? 'Ubicación reactivada' : 'Ubicación desactivada'),
        onError: (error) => toast.error(mensajeActivacion(error)),
        onSettled: () => {
          enviando.current = false
          setPorDesactivar(null)
        },
      },
    )
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight">Ubicaciones</h1>
        <Button onClick={() => setFormulario({})}>
          <MapPinPlus className="mr-2 h-4 w-4" aria-hidden />
          Nueva ubicación
        </Button>
      </div>

      {ubicaciones.isPending ? (
        <div aria-label="Cargando ubicaciones" className="space-y-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : ubicaciones.isError ? (
        <EstadoError error={ubicaciones.error} onRetry={() => ubicaciones.refetch()} />
      ) : ubicaciones.data.content.length === 0 ? (
        <EstadoVacio icono={MapPin} titulo="Todavía no hay ubicaciones" descripcion="Crea la primera con el botón Nueva ubicación." />
      ) : (
        <>
          <div className={MARCO_TABLA}>
            <Table>
              <TableHeader className={CABECERA_APILADA}>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className={CUERPO_APILADO}>
                {ubicaciones.data.content.map((u) => (
                  <TableRow key={u.id} className={FILA_APILADA}>
                    <TableCell className={`${CELDA_APILADA} font-semibold`}>{u.nombre}</TableCell>
                    <TableCell className={CELDA_APILADA}>{u.direccion}</TableCell>
                    <TableCell className={`${CELDA_APILADA} tabular`}>{u.capacidad}</TableCell>
                    <TableCell className={CELDA_APILADA}>
                      <Badge variant={u.activo ? 'secondary' : 'outline'}>{u.activo ? 'Activa' : 'Inactiva'}</Badge>
                    </TableCell>
                    <TableCell className={CELDA_APILADA}>
                      <ConteoEventos ubicacionId={u.id} />
                    </TableCell>
                    <TableCell className={`${CELDA_APILADA} md:text-right`}>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button variant="outline" size="sm" aria-label={`Editar ${u.nombre}`} onClick={() => setFormulario({ ubicacion: u })}>
                          Editar
                        </Button>
                        {u.activo ? (
                          <Button variant="outline" size="sm" aria-label={`Desactivar ${u.nombre}`} onClick={() => setPorDesactivar(u)}>
                            Desactivar
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" aria-label={`Reactivar ${u.nombre}`} disabled={cambiarActiva.isPending} onClick={() => cambiar(u, true)}>
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Paginacion page={ubicaciones.data.number} totalPages={ubicaciones.data.totalPages} onChange={setPage} />
        </>
      )}

      <UbicacionForm ubicacion={formulario?.ubicacion} open={formulario !== null} onOpenChange={(abierto) => !abierto && setFormulario(null)} />
      <ConfirmDialog
        open={porDesactivar !== null}
        onOpenChange={(abierto) => !abierto && setPorDesactivar(null)}
        titulo="¿Desactivar esta ubicación?"
        descripcion={`${porDesactivar?.nombre ?? 'Esta ubicación'} dejará de ofrecerse para nuevos eventos. Podrás reactivarla más tarde.`}
        accion="Sí, desactivar"
        onConfirm={() => porDesactivar && cambiar(porDesactivar, false)}
        pendiente={cambiarActiva.isPending}
        destructivo
      />
    </>
  )
}
