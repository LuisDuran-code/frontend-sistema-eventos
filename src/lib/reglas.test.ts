import { describe, expect, it } from 'vitest'
import type { Evento } from '@/types'
import { aSesion, haComenzado, haTerminado, motivoBloqueo, motivoEdicionBloqueada, rutaInicial, selloDeEvento } from './reglas'

const base: Evento = {
  id: 1,
  nombre: 'Taller',
  descripcion: null,
  fecha: '2026-11-08',
  horaInicio: '14:00:00',
  horaFin: '16:00:00',
  cupo: 30,
  inscritos: 22,
  cuposDisponibles: 8,
  estado: 'PROGRAMADO',
  ubicacion: { id: 1, nombre: 'Sala Norte', direccion: 'Calle 1' },
}
const antes = new Date(2026, 10, 7, 10, 0)
const durante = new Date(2026, 10, 8, 15, 0)
const despues = new Date(2026, 10, 8, 17, 0)

describe('tiempo del evento', () => {
  it('detecta inicio y fin', () => {
    expect(haComenzado(base, antes)).toBe(false)
    expect(haComenzado(base, durante)).toBe(true)
    expect(haTerminado(base, durante)).toBe(false)
    expect(haTerminado(base, despues)).toBe(true)
  })
})

describe('motivoBloqueo', () => {
  const c = { inscrito: false, ahora: antes }

  it('permite inscribirse', () => {
    expect(motivoBloqueo(base, c)).toBeNull()
  })

  it('explica un evento lleno', () => {
    expect(motivoBloqueo({ ...base, cuposDisponibles: 0 }, c)).toBe('El evento está lleno')
  })

  it('prioriza ya inscrito sobre lleno', () => {
    expect(motivoBloqueo({ ...base, cuposDisponibles: 0 }, { ...c, inscrito: true })).toBe('Ya estás inscrito en este evento')
  })

  it('prioriza comenzado sobre inscrito', () => {
    expect(motivoBloqueo(base, { inscrito: true, ahora: durante })).toBe('El evento ya comenzó')
  })

  it('prioriza terminado sobre comenzado', () => {
    expect(motivoBloqueo(base, { inscrito: false, ahora: despues })).toBe('El evento ya terminó')
  })

  it('prioriza cancelado sobre todo', () => {
    expect(motivoBloqueo({ ...base, estado: 'CANCELADO' }, { inscrito: true, ahora: despues })).toBe('Este evento fue cancelado')
  })
})

describe('selloDeEvento', () => {
  const c = { inscrito: false, ahora: antes }

  it('no sella un evento normal', () => {
    expect(selloDeEvento(base, c)).toBeNull()
  })

  it('sigue la prioridad Cancelado, Finalizado, Inscrito, Lleno', () => {
    const lleno = { ...base, cuposDisponibles: 0 }
    expect(selloDeEvento(lleno, c)).toBe('Lleno')
    expect(selloDeEvento(lleno, { ...c, inscrito: true })).toBe('Inscrito')
    expect(selloDeEvento(lleno, { inscrito: true, ahora: despues })).toBe('Finalizado')
    expect(selloDeEvento({ ...lleno, estado: 'CANCELADO' }, { inscrito: true, ahora: despues })).toBe('Cancelado')
  })
})

describe('otras reglas', () => {
  it('bloquea la edición de un cancelado', () => {
    expect(motivoEdicionBloqueada({ ...base, estado: 'CANCELADO' })).toBe('No se puede editar un evento cancelado')
    expect(motivoEdicionBloqueada(base)).toBeNull()
  })

  it('bloquea editar un evento comenzado con inscritos, que la API siempre rechazaría', () => {
    const pasado = { ...base, fecha: '2020-01-01', inscritos: 1 }
    expect(motivoEdicionBloqueada(pasado)).toBe('Ya comenzó y tiene inscritos')
    expect(motivoEdicionBloqueada({ ...pasado, inscritos: 0 })).toBeNull()
  })

  it('convierte roles de /auth/me', () => {
    expect(aSesion({ email: 'a@b.c', roles: ['ROLE_ADMIN'] })).toEqual({ email: 'a@b.c', rol: 'ADMIN' })
  })

  it('conserva los datos cuando llegan', () => {
    expect(aSesion({ email: 'a@b.c', rol: 'VISITANTE', id: 3, nombre: 'Ana' })).toEqual({
      email: 'a@b.c',
      rol: 'VISITANTE',
      id: 3,
      nombre: 'Ana',
    })
  })

  it('elige la ruta inicial por rol', () => {
    expect(rutaInicial('ADMIN')).toBe('/admin/eventos')
    expect(rutaInicial('VISITANTE')).toBe('/eventos')
  })
})
