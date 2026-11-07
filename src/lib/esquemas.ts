import { startOfDay } from 'date-fns'
import { z } from 'zod'
import type { EventoInput } from '@/types'
import { aFechaApi, aFechaLocal } from './fechas'

export const loginSchema = z.object({
  email: z.string().email('Escribe un correo válido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registroSchema = z.object({
  nombre: z.string().trim().min(1, 'Escribe tu nombre').max(100, 'Máximo 100 caracteres'),
  email: z.string().trim().email('Escribe un correo válido').max(100, 'Máximo 100 caracteres'),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
})
export type RegistroValues = z.infer<typeof registroSchema>

const entero = (minimo: string) =>
  z.coerce.number({ invalid_type_error: 'Escribe un número' }).int('Debe ser un número entero').min(1, minimo)

const camposEvento = z.object({
  nombre: z.string().trim().min(1, 'Escribe el nombre').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  fecha: z.date({ required_error: 'Elige una fecha' }),
  horaInicio: z.string().min(1, 'Elige la hora de inicio'),
  horaFin: z.string().min(1, 'Elige la hora de fin'),
  cupo: entero('Debe ser mayor que 0'),
  ubicacionId: z.coerce.number({ invalid_type_error: 'Elige una ubicación' }).int().positive('Elige una ubicación'),
})
export type EventoValues = z.infer<typeof camposEvento>

export function eventoSchema({ capacidad, ahora, minimoCupo }: { capacidad?: number; ahora: Date; minimoCupo?: number }) {
  return camposEvento.superRefine((v, ctx) => {
    if (v.horaFin && v.horaInicio && v.horaFin <= v.horaInicio) {
      ctx.addIssue({ code: 'custom', path: ['horaFin'], message: 'La hora de fin debe ser posterior a la de inicio' })
    }
    if (startOfDay(v.fecha) < startOfDay(ahora)) {
      ctx.addIssue({ code: 'custom', path: ['fecha'], message: 'La fecha no puede estar en el pasado' })
    } else if (v.horaInicio && aFechaLocal(aFechaApi(v.fecha), v.horaInicio) <= ahora) {
      ctx.addIssue({ code: 'custom', path: ['horaInicio'], message: 'La hora de inicio ya pasó' })
    }
    if (capacidad !== undefined && v.cupo > capacidad) {
      ctx.addIssue({ code: 'custom', path: ['cupo'], message: `No puede superar la capacidad máxima (${capacidad})` })
    }
    if (minimoCupo !== undefined && v.cupo < minimoCupo) {
      ctx.addIssue({ code: 'custom', path: ['cupo'], message: `No puede ser menor que los inscritos actuales (${minimoCupo})` })
    }
  })
}

export function aEventoInput(v: EventoValues): EventoInput {
  return {
    nombre: v.nombre,
    descripcion: v.descripcion || undefined,
    fecha: aFechaApi(v.fecha),
    horaInicio: v.horaInicio,
    horaFin: v.horaFin,
    cupo: v.cupo,
    ubicacionId: v.ubicacionId,
  }
}

export const ubicacionSchema = z.object({
  nombre: z.string().trim().min(1, 'Escribe el nombre').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().max(500, 'Máximo 500 caracteres').optional(),
  direccion: z.string().trim().min(1, 'Escribe la dirección').max(200, 'Máximo 200 caracteres'),
  capacidad: entero('Debe ser mayor que 0'),
  imagenPrincipal: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .regex(/^https:\/\/\S+$/, 'Debe ser una URL https')
    .or(z.literal(''))
    .optional(),
})
export type UbicacionValues = z.infer<typeof ubicacionSchema>
