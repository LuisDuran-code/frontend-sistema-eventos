import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useDebounce } from '@/hooks/useDebounce'
import { useCambiarActivaUbicacion, useEventosDeUbicacion, useGuardarUbicacion } from '@/hooks/useUbicaciones'
import { mensajeError } from '@/lib/api'
import { ubicacionSchema, type UbicacionValues } from '@/lib/esquemas'
import type { Ubicacion } from '@/types'
import { mensajeActivacion } from './mensajesUbicacion'

interface UbicacionFormProps {
  ubicacion?: Ubicacion
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Formulario({ ubicacion, onCerrar }: { ubicacion?: Ubicacion; onCerrar: () => void }) {
  const guardar = useGuardarUbicacion()
  const cambiarActiva = useCambiarActivaUbicacion()
  const [activa, setActiva] = useState(ubicacion?.activo ?? true)
  const enviando = useRef(false)

  const form = useForm<UbicacionValues>({
    resolver: zodResolver(ubicacionSchema),
    defaultValues: {
      nombre: ubicacion?.nombre ?? '',
      descripcion: ubicacion?.descripcion ?? '',
      direccion: ubicacion?.direccion ?? '',
      capacidad: (ubicacion?.capacidad ?? '') as number,
      imagenPrincipal: ubicacion?.imagenPrincipal ?? '',
    },
  })

  const capacidad = useDebounce(Number(form.watch('capacidad')))
  const reducida = ubicacion !== undefined && capacidad > 0 && capacidad < ubicacion.capacidad
  const eventos = useEventosDeUbicacion(ubicacion?.id, reducida)
  const excedidos = reducida ? (eventos.data ?? []).filter((e) => e.estado !== 'CANCELADO' && e.cupo > capacidad) : []

  async function enviar(v: UbicacionValues) {
    if (enviando.current) return
    enviando.current = true
    const input = {
      nombre: v.nombre,
      descripcion: v.descripcion || undefined,
      direccion: v.direccion,
      capacidad: v.capacidad,
      imagenPrincipal: v.imagenPrincipal || undefined,
      imagenes: ubicacion?.imagenes ?? [],
    }
    try {
      await guardar.mutateAsync({ id: ubicacion?.id, input })
      toast.success(ubicacion ? 'Ubicación actualizada' : 'Ubicación creada')
      onCerrar()
    } catch (error) {
      form.setError('root', { message: mensajeError(error, { 409: 'Ya existe una ubicación con ese nombre' }, 'No se pudo guardar la ubicación') })
    } finally {
      enviando.current = false
    }
  }

  function alternarActiva(valor: boolean) {
    if (!ubicacion) return
    cambiarActiva.mutate(
      { id: ubicacion.id, activa: valor },
      {
        onSuccess: () => {
          setActiva(valor)
          toast.success(valor ? 'Ubicación reactivada' : 'Ubicación desactivada')
        },
        onError: (error) => toast.error(mensajeActivacion(error)),
      },
    )
  }

  const { errors, isSubmitting } = form.formState

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(enviar)} noValidate className="space-y-4">
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
          name="direccion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input maxLength={200} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="capacidad"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Capacidad máxima</FormLabel>
              <FormControl>
                <Input type="number" inputMode="numeric" min={1} className="tabular" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {excedidos.length > 0 && (
          <p role="status" className="rounded-md bg-secondary px-3 py-2 text-sm">
            Esta capacidad es menor que el cupo de {excedidos.map((e) => `${e.nombre} (${e.cupo})`).join(', ')}. Puedes guardar, pero revisa esos eventos.
          </p>
        )}
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
        <FormField
          control={form.control}
          name="imagenPrincipal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagen principal (URL)</FormLabel>
              <FormControl>
                <Input type="url" maxLength={500} placeholder="https://" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {ubicacion && (
          <div className="flex items-center justify-between gap-4 rounded-md border px-3 py-2">
            <Label htmlFor="ubicacion-activa">Ubicación activa</Label>
            <Switch id="ubicacion-activa" checked={activa} disabled={cambiarActiva.isPending} onCheckedChange={alternarActiva} />
          </div>
        )}
        {errors.root && (
          <p role="alert" className="rounded-md border border-destructive px-3 py-2 text-sm font-semibold text-destructive">
            {errors.root.message}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCerrar}>
            Volver
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {ubicacion ? 'Guardar cambios' : 'Crear ubicación'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export function UbicacionForm({ ubicacion, open, onOpenChange }: UbicacionFormProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{ubicacion ? 'Editar ubicación' : 'Nueva ubicación'}</DialogTitle>
          <DialogDescription>{ubicacion ? ubicacion.nombre : 'Toda ubicación nueva nace activa.'}</DialogDescription>
        </DialogHeader>
        <Formulario key={ubicacion?.id ?? 'nueva'} ubicacion={ubicacion} onCerrar={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
