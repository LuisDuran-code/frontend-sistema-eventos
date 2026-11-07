import { forwardRef, useState, type ComponentPropsWithoutRef } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface CampoFechaProps extends Omit<ComponentPropsWithoutRef<typeof Button>, 'value' | 'onChange'> {
  value?: Date
  onChange: (fecha: Date | undefined) => void
}

export const CampoFecha = forwardRef<HTMLButtonElement, CampoFechaProps>(function CampoFecha({ value, onChange, ...boton }, ref) {
  const [abierto, setAbierto] = useState(false)
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button ref={ref} type="button" variant="outline" className="tabular w-full justify-start font-normal" {...boton}>
          <CalendarDays className="mr-2 h-4 w-4" aria-hidden />
          {value ? format(value, 'd MMM yyyy', { locale: es }) : 'Elige una fecha'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          defaultMonth={value}
          onSelect={(fecha) => {
            onChange(fecha)
            setAbierto(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
})
