import { mensajeError } from '@/lib/api'

export function mensajeActivacion(error: unknown): string {
  return mensajeError(error, { 409: 'La ubicación tiene eventos activos' }, 'No se pudo cambiar el estado de la ubicación')
}
