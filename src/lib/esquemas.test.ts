import { describe, expect, it } from 'vitest'
import { aEventoInput, eventoSchema, loginSchema, ubicacionSchema } from './esquemas'

const ahora = new Date(2026, 10, 7, 10, 0)
const valido = {
  nombre: 'Taller',
  descripcion: '',
  fecha: new Date(2026, 10, 8),
  horaInicio: '14:00',
  horaFin: '16:00',
  cupo: 30,
  ubicacionId: 1,
}

function errores(r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return r.error?.issues.map((i) => i.path[0]) ?? []
}

describe('loginSchema', () => {
  it('rechaza correo inválido y contraseña vacía', () => {
    const r = loginSchema.safeParse({ email: 'x', password: '' })
    expect(errores(r)).toEqual(['email', 'password'])
  })
})

describe('eventoSchema', () => {
  const schema = eventoSchema({ capacidad: 40, ahora })

  it('acepta un evento válido', () => {
    expect(schema.safeParse(valido).success).toBe(true)
  })

  it.each(['14:00', '13:00'])('rechaza fin %s con error en horaFin', (horaFin) => {
    expect(errores(schema.safeParse({ ...valido, horaFin }))).toEqual(['horaFin'])
  })

  it('rechaza una fecha pasada', () => {
    expect(errores(schema.safeParse({ ...valido, fecha: new Date(2026, 10, 6) }))).toEqual(['fecha'])
  })

  it('rechaza hoy con hora de inicio ya pasada', () => {
    const r = schema.safeParse({ ...valido, fecha: new Date(2026, 10, 7), horaInicio: '09:00' })
    expect(errores(r)).toEqual(['horaInicio'])
  })

  it.each([0, 1.5, 41])('rechaza cupo %s', (cupo) => {
    expect(errores(schema.safeParse({ ...valido, cupo }))).toEqual(['cupo'])
  })

  it('rechaza cupo menor que el mínimo', () => {
    const r = eventoSchema({ capacidad: 40, ahora, minimoCupo: 10 }).safeParse({ ...valido, cupo: 9 })
    expect(errores(r)).toEqual(['cupo'])
  })

  it('convierte a EventoInput', () => {
    expect(aEventoInput(valido)).toEqual({
      nombre: 'Taller',
      descripcion: undefined,
      fecha: '2026-11-08',
      horaInicio: '14:00',
      horaFin: '16:00',
      cupo: 30,
      ubicacionId: 1,
    })
  })
})

describe('ubicacionSchema', () => {
  const base = { nombre: 'Sala', descripcion: '', direccion: 'Calle 1', capacidad: 20 }

  it('rechaza capacidad 0', () => {
    expect(errores(ubicacionSchema.safeParse({ ...base, capacidad: 0 }))).toEqual(['capacidad'])
  })
})
