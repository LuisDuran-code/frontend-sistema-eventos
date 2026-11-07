import { useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { toast } from 'sonner'
import { EstadoError } from '@/components/EstadoError'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { mensajeInscripcion } from '@/features/inscripciones/mensajes'
import { useAgregarInscrito, useTodosLosInscritos } from '@/hooks/useEventos'
import { useUsuariosVisitantes } from '@/hooks/useUsuarios'
import type { Evento } from '@/types'

interface AgregarAsistenteDialogProps {
  evento: Evento
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Selector({ evento, onCerrar }: { evento: Evento; onCerrar: () => void }) {
  const usuarios = useUsuariosVisitantes()
  const inscritos = useTodosLosInscritos(evento.id)
  const agregar = useAgregarInscrito(evento.id)
  const [elegido, setElegido] = useState<number | null>(null)
  const enviando = useRef(false)

  const yaInscritos = new Set(inscritos.data?.map((i) => i.usuarioId))
  const disponibles = (usuarios.data ?? []).filter((u) => !yaInscritos.has(u.id))
  const cargando = usuarios.isPending || inscritos.isPending

  function confirmar() {
    if (elegido === null || enviando.current) return
    enviando.current = true
    agregar.mutate(elegido, {
      onSuccess: () => {
        toast.success('Asistente agregado')
        onCerrar()
      },
      onError: (error) => toast.error(mensajeInscripcion(error)),
      onSettled: () => {
        enviando.current = false
      },
    })
  }

  const fallo = usuarios.error ?? inscritos.error
  if (fallo) {
    return (
      <EstadoError
        error={fallo}
        onRetry={() => {
          usuarios.refetch()
          inscritos.refetch()
        }}
      />
    )
  }

  return (
    <>
      <Command className="rounded-md border">
        <CommandInput aria-label="Buscar persona" placeholder="Buscar por nombre o correo" />
        <CommandList>
          <CommandEmpty>{cargando ? 'Cargando personas…' : 'Nadie coincide con la búsqueda'}</CommandEmpty>
          {disponibles.map((u) => (
            <CommandItem key={u.id} value={`${u.nombre} ${u.email}`} onSelect={() => setElegido(u.id)}>
              <Check className={`mr-2 h-4 w-4 shrink-0 ${elegido === u.id ? 'opacity-100' : 'opacity-0'}`} aria-hidden />
              <span className="min-w-0">
                <span className="block font-semibold">{u.nombre}</span>
                <span className="block truncate text-sm text-muted-foreground">{u.email}</span>
              </span>
            </CommandItem>
          ))}
        </CommandList>
      </Command>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" disabled={agregar.isPending} onClick={onCerrar}>
          Volver
        </Button>
        <Button type="button" disabled={elegido === null || agregar.isPending} onClick={confirmar}>
          Agregar
        </Button>
      </DialogFooter>
    </>
  )
}

export function AgregarAsistenteDialog({ evento, open, onOpenChange }: AgregarAsistenteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Agregar asistente</DialogTitle>
          <DialogDescription>Elige a la persona que quieres inscribir en {evento.nombre}.</DialogDescription>
        </DialogHeader>
        <Selector evento={evento} onCerrar={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  )
}
