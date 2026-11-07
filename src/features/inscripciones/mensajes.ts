import { mensajeError } from '@/lib/api'

export function mensajeInscripcion(error: unknown): string {
  return mensajeError(error, { 404: 'El evento no está disponible' }, 'No se pudo completar la inscripción')
}
