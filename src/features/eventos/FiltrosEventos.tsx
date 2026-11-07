import { useEffect, useState } from 'react'
import { CalendarDays, Search, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDebounce } from '@/hooks/useDebounce'
import { aFechaApi, aFechaLocal } from '@/lib/fechas'
import type { Ubicacion } from '@/types'

const TODAS = 'todas'

export interface ValoresFiltros {
  q: string
  ubicacion: string
  desde: string
  hasta: string
}

interface FiltrosProps {
  valores: ValoresFiltros
  ubicaciones: Ubicacion[]
  onChange: (cambios: Partial<ValoresFiltros>) => void
  onLimpiar: () => void
}

function textoRango(desde: string, hasta: string): string {
  if (!desde) return 'Fechas'
  return hasta && hasta !== desde ? `${desde} a ${hasta}` : desde
}

export function FiltrosEventos({ valores, ubicaciones, onChange, onLimpiar }: FiltrosProps) {
  const [texto, setTexto] = useState(valores.q)
  const retrasado = useDebounce(texto)

  useEffect(() => setTexto(valores.q), [valores.q])

  useEffect(() => {
    if (retrasado !== valores.q) onChange({ q: retrasado })
    // Solo reacciona al texto ya estabilizado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retrasado])

  const rango: DateRange | undefined = valores.desde
    ? { from: aFechaLocal(valores.desde), to: valores.hasta ? aFechaLocal(valores.hasta) : undefined }
    : undefined
  const hayFiltros = Boolean(valores.q || valores.ubicacion || valores.desde)

  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:flex-wrap">
      <div className="relative md:w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input aria-label="Buscar por título" placeholder="Buscar por título" className="bg-card pl-9" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>
      <Select value={valores.ubicacion || TODAS} onValueChange={(v) => onChange({ ubicacion: v === TODAS ? '' : v })}>
        <SelectTrigger aria-label="Ubicación" className="bg-card md:w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODAS}>Todas las ubicaciones</SelectItem>
          {ubicaciones.map((u) => (
            <SelectItem key={u.id} value={String(u.id)}>
              {u.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="tabular justify-start bg-card font-normal md:w-60">
            <CalendarDays className="mr-2 h-4 w-4" aria-hidden />
            {textoRango(valores.desde, valores.hasta)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={rango}
            onSelect={(r) => onChange({ desde: r?.from ? aFechaApi(r.from) : '', hasta: r?.to ? aFechaApi(r.to) : '' })}
          />
        </PopoverContent>
      </Popover>
      {hayFiltros && (
        <Button variant="ghost" onClick={onLimpiar}>
          <X className="mr-2 h-4 w-4" aria-hidden />
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}
