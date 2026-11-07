import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, type Resolver } from 'react-hook-form'
import { toast } from 'sonner'
import { CampoFecha } from '@/components/CampoFecha'
import { CampoImagenes } from '@/components/CampoImagenes'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useActualizarEvento, useCrearEvento } from '@/hooks/useEventos'
import { useUbicaciones } from '@/hooks/useUbicaciones'
import { mensajeError } from '@/lib/api'
import { aEventoInput, eventoSchema, type EventoValues } from '@/lib/esquemas'
import { aFechaLocal } from '@/lib/fechas'
import type { Evento } from '@/types'

interface EventoFormProps {
  evento?: Evento
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ERROR_GENERICO = 'No se pudo guardar el evento'

function Formulario({ evento, onCerrar }: { evento?: Evento; onCerrar: () => void }) {
  const ubicaciones = useUbicaciones({ size: 50 })
  const crear = useCrearEvento()
  const actualizar = useActualizarEvento()
  const enviando = useRef(false)
  const [imagenes, setImagenes] = useState(evento?.imagenes ?? [])
  const [subiendo, setSubiendo] = useState(false)
  const conInscritos = (evento?.inscritos ?? 0) > 0

  const form = useForm<EventoValues>({
    defaultValues: {
      nombre: evento?.nombre ?? '',
      descripcion: evento?.descripcion ?? '',
      fecha: evento ? aFechaLocal(evento.fecha) : undefined,
      horaInicio: evento?.horaInicio.slice(0, 5) ?? '',
      horaFin: evento?.horaFin.slice(0, 5) ?? '',
      cupo: (evento?.cupo ?? '') as number,
      ubicacionId: (evento?.ubicacion.id ?? '') as number,
    },
    resolver: ((...args) =>
      zodResolver(eventoSchema({ capacidad, ahora: new Date(), minimoCupo: evento?.inscritos }))(...args)) as Resolver<EventoValues>,
  })

  const ubicacionId = Number(form.watch('ubicacionId'))
  const lista = ubicaciones.data?.content ?? []
  const capacidad = lista.find((u) => u.id === ubicacionId)?.capacidad
  const opciones = lista.filter((u) => u.activo || u.id === evento?.ubicacion.id)

  async function enviar(valores: EventoValues) {
    if (enviando.current) return
    enviando.current = true
    const input = { ...aEventoInput(valores), imagenes }
    try {
      if (evento) await actualizar.mutateAsync({ id: evento.id, input })
      else await crear.mutateAsync(input)
      toast.success(evento ? 'Evento actualizado' : 'Evento creado')
      onCerrar()
    } catch (error) {
      form.setError('root', { message: mensajeError(error, {}, ERROR_GENERICO) })
    } finally {
      enviando.current = false
    }
  }

  const { errors, isSubmitting } = form.formState

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(enviar)} noValidate className="mt-5 space-y-4">
        <FormField
          control={form.control}
          name="nombre"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input maxLength={150} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="descripcion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea rows={3} maxLength={500} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {conInscritos && (
          <p className="rounded-md bg-secondary px-3 py-2 text-sm">
            Este evento ya tiene inscritos: su fecha, sus horas y su ubicación no se pueden cambiar.
          </p>
        )}
        <FormField
          control={form.control}
          name="ubicacionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación</FormLabel>
              <Select disabled={conInscritos} value={field.value ? String(field.value) : ''} onValueChange={(v) => field.onChange(Number(v))}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Elige una ubicación" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {opciones.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.activo ? u.nombre : `${u.nombre} (inactiva)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fecha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha</FormLabel>
              <FormControl>
                <CampoFecha value={field.value} onChange={field.onChange} disabled={conInscritos} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="horaInicio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de inicio</FormLabel>
                <FormControl>
                  <Input type="time" className="tabular" disabled={conInscritos} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="horaFin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de fin</FormLabel>
                <FormControl>
                  <Input type="time" className="tabular" disabled={conInscritos} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="cupo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cupo</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" min={1} className="tabular" {...field} />
              </FormControl>
              {capacidad !== undefined && <FormDescription>Capacidad máxima: {capacidad}</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />
        <CampoImagenes etiqueta="Imágenes del evento" imagenes={imagenes} onChange={setImagenes} maximo={10} onSubiendoChange={setSubiendo} />
        {errors.root && (
          <p role="alert" className="rounded-md border border-destructive px-3 py-2 text-sm font-semibold text-destructive">
            {errors.root.message}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCerrar}>
            Volver
          </Button>
          <Button type="submit" disabled={isSubmitting || subiendo}>
            {evento ? 'Guardar cambios' : 'Crear evento'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export function EventoForm({ evento, open, onOpenChange }: EventoFormProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{evento ? 'Editar evento' : 'Nuevo evento'}</SheetTitle>
          <SheetDescription>{evento ? evento.nombre : 'Los visitantes lo verán en la cartelera al crearlo.'}</SheetDescription>
        </SheetHeader>
        <Formulario key={evento?.id ?? 'nuevo'} evento={evento} onCerrar={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}
