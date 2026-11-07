import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Evento } from '@/types'

export function aFechaLocal(fecha: string, hora = '00:00'): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const [horas, minutos] = hora.split(':').map(Number)
  return new Date(anio, mes - 1, dia, horas, minutos)
}

function formatear(d: Date): string {
  return format(d, 'EEE d MMM yyyy, HH:mm', { locale: es }).replace(/\./g, '')
}

export function formatoFechaHora(fecha: string, hora: string): string {
  return formatear(aFechaLocal(fecha, hora))
}

export function formatoHorario(e: Pick<Evento, 'fecha' | 'horaInicio' | 'horaFin'>): string {
  return `${formatoFechaHora(e.fecha, e.horaInicio)} a ${e.horaFin.slice(0, 5)}`
}

export function formatoRegistro(valor: string): string {
  if (!valor.includes('T')) return valor.slice(0, 5)
  const [fecha, hora] = valor.split('T')
  return formatoFechaHora(fecha, hora)
}

export function aFechaApi(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}
