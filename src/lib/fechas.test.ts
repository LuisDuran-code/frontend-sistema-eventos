import { describe, expect, it } from 'vitest'
import { aFechaApi, aFechaLocal, formatoFechaHora, formatoHorario, formatoRegistro } from './fechas'

process.env.TZ = 'America/El_Salvador'

describe('fechas', () => {
  it('no interpreta la fecha como UTC', () => {
    expect(aFechaLocal('2026-11-08').getDate()).toBe(8)
  })

  it('formatea fecha y hora', () => {
    expect(formatoFechaHora('2026-11-08', '14:00:00')).toBe('sáb 8 nov 2026, 14:00')
  })

  it('acepta horas sin segundos', () => {
    expect(formatoFechaHora('2026-11-08', '14:00')).toBe('sáb 8 nov 2026, 14:00')
  })

  it('formatea el horario de un evento', () => {
    expect(formatoHorario({ fecha: '2026-11-08', horaInicio: '14:00:00', horaFin: '16:00:00' })).toBe(
      'sáb 8 nov 2026, 14:00 a 16:00',
    )
  })

  it('formatea un registro con fecha y hora', () => {
    expect(formatoRegistro('2026-11-08T09:30:00')).toBe('sáb 8 nov 2026, 09:30')
  })

  it('formatea un registro que solo trae hora', () => {
    expect(formatoRegistro('09:30:00')).toBe('09:30')
  })

  it('convierte a fecha de API en hora local', () => {
    expect(aFechaApi(new Date(2026, 10, 8, 23, 30))).toBe('2026-11-08')
  })
})
