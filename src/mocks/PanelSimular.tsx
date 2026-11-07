import { useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { reiniciarDb } from './db'
import { ERRORES_SIMULADOS, errorPendiente, simularError, type ErrorSimulado } from './simulador'

const NINGUNO = 'NINGUNO'

export function PanelSimular() {
  const [valor, setValor] = useState<string>(errorPendiente() ?? NINGUNO)

  function elegir(nuevo: string) {
    setValor(nuevo)
    simularError(nuevo === NINGUNO ? null : (nuevo as ErrorSimulado))
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 border-t bg-card px-4 py-2 text-sm">
      <span className="font-semibold">Datos de ejemplo</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <FlaskConical className="mr-2 h-4 w-4" />
            Simular error
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 space-y-3">
          <p className="text-sm">Fuerza el resultado de la siguiente inscripción.</p>
          <Select value={valor} onValueChange={elegir}>
            <SelectTrigger aria-label="Error a simular">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NINGUNO}>Sin error</SelectItem>
              {ERRORES_SIMULADOS.map((e) => (
                <SelectItem key={e.valor} value={e.valor}>
                  {e.etiqueta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              reiniciarDb()
              location.assign('/login')
            }}
          >
            Reiniciar datos de ejemplo
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}
