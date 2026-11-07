import { useRef, useState } from 'react'
import { UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { BotonConMotivo } from '@/components/BotonConMotivo'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { useInscribirse } from '@/hooks/useInscripciones'
import { motivoBloqueo } from '@/lib/reglas'
import type { Evento } from '@/types'
import { mensajeInscripcion } from './mensajes'

interface AccionesEventoProps {
  evento: Evento
  inscrito: boolean
  onInscrito: () => void
}

export function AccionesEvento({ evento, inscrito, onInscrito }: AccionesEventoProps) {
  const { sesion } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const inscribirse = useInscribirse()
  const enviando = useRef(false)

  if (sesion?.rol === 'ADMIN') {
    return (
      <Button asChild size="lg">
        <Link to={`/admin/eventos/${evento.id}/asistentes`}>
          <UsersRound className="mr-2 h-4 w-4" aria-hidden />
          Gestionar asistentes
        </Link>
      </Button>
    )
  }

  function confirmar() {
    if (enviando.current) return
    enviando.current = true
    inscribirse.mutate(evento.id, {
      onSuccess: () => {
        onInscrito()
        toast.success('Te inscribiste en el evento')
      },
      onError: (error) => toast.error(mensajeInscripcion(error)),
      onSettled: () => {
        enviando.current = false
        setAbierto(false)
      },
    })
  }

  return (
    <>
      <BotonConMotivo size="lg" className="w-full sm:w-auto" motivo={motivoBloqueo(evento, { inscrito, ahora: new Date() })} onClick={() => setAbierto(true)}>
        Inscribirme
      </BotonConMotivo>
      <ConfirmDialog
        open={abierto}
        onOpenChange={setAbierto}
        titulo="¿Confirmas tu inscripción?"
        descripcion={`Reservarás un cupo en ${evento.nombre}.`}
        accion="Confirmar inscripción"
        onConfirm={confirmar}
        pendiente={inscribirse.isPending}
      />
    </>
  )
}
