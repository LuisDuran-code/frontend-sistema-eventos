import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/lib/api'
import { getMe, login } from '@/services/auth'
import { actualizarEvento, agregarInscrito, cancelarEvento, listarEventos, listarInscritos, retirarInscrito } from '@/services/eventos'
import { cancelarInscripcion, inscribirse, listarMias } from '@/services/inscripciones'
import { actualizarUbicacion, desactivarUbicacion, obtenerUbicacion, reactivarUbicacion } from '@/services/ubicaciones'
import { reiniciarDb } from './db'
import { server } from './server'
import { simularError } from './simulador'

const ADMIN = ['admin@aforo.test', 'admin1234'] as const
const VISITANTE = ['visitante@aforo.test', 'visitante1234'] as const
const CERAMICA = 1
const FERIA_LLENA = 4
const MERCADO_EN_CURSO = 7
const VOLUNTARIADO_CANCELADO = 9
const FOTOGRAFIA_SOLAPA = 10
const FORO = 2

async function fallo(p: Promise<unknown>): Promise<ApiError> {
  return p.then(
    () => {
      throw new Error('debía fallar')
    },
    (e: ApiError) => e,
  )
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
beforeEach(() => {
  reiniciarDb(new Date(2026, 10, 7, 12, 0))
  simularError(null)
})

describe('sesión', () => {
  it('rechaza credenciales incorrectas', async () => {
    const e = await fallo(login(ADMIN[0], 'mala'))
    expect(e.status).toBe(401)
    expect(e.message).toBe('Credenciales inválidas')
  })

  it('devuelve el usuario al entrar', async () => {
    const u = await login(...ADMIN)
    expect(u.rol).toBe('ADMIN')
    expect(u.nombre).toBeTruthy()
  })

  it('da 401 en /auth/me sin sesión', async () => {
    expect((await fallo(getMe())).status).toBe(401)
  })

  it('devuelve roles con prefijo en /auth/me', async () => {
    await login(...ADMIN)
    expect((await getMe()).roles).toEqual(['ROLE_ADMIN'])
  })
})

describe('eventos', () => {
  it('filtra por nombre y pagina', async () => {
    await login(...VISITANTE)
    const p = await listarEventos({ nombre: 'cerámica', size: 12 })
    expect(p.totalElements).toBe(1)
    expect(p.content[0].nombre).toBe('Taller de cerámica')
    expect(p.size).toBe(12)
  })

  it('oculta los cancelados al visitante', async () => {
    await login(...VISITANTE)
    const p = await listarEventos({ size: 50 })
    expect(p.content.some((e) => e.estado === 'CANCELADO')).toBe(false)
  })

  it('muestra los cancelados al admin', async () => {
    await login(...ADMIN)
    const p = await listarEventos({ size: 50 })
    expect(p.content.some((e) => e.estado === 'CANCELADO')).toBe(true)
  })

  it('rechaza mover un evento con inscritos', async () => {
    await login(...ADMIN)
    const e = await fallo(
      actualizarEvento(CERAMICA, {
        nombre: 'Taller de cerámica',
        fecha: '2026-12-01',
        horaInicio: '14:00',
        horaFin: '16:00',
        cupo: 30,
        ubicacionId: 2,
      }),
    )
    expect(e.status).toBe(409)
    expect(e.message).toBe('No se puede cambiar la fecha, hora o ubicación de un evento que ya tiene inscritos activos')
  })

  it('cancelar un evento cancela sus inscripciones', async () => {
    await login(...ADMIN)
    await cancelarEvento(CERAMICA)
    await login(...VISITANTE)
    const mias = await listarMias('CONFIRMADA')
    expect(mias.content.some((i) => i.evento.id === CERAMICA)).toBe(false)
  })
})

describe('inscripciones', () => {
  it('rechaza inscribirse dos veces', async () => {
    await login(...VISITANTE)
    const e = await fallo(inscribirse(CERAMICA))
    expect(e.status).toBe(409)
    expect(e.message).toBe('Ya estás inscrito en este evento')
  })

  it('rechaza un evento lleno', async () => {
    await login(...VISITANTE)
    expect((await fallo(inscribirse(FERIA_LLENA))).message).toBe('El evento está lleno')
  })

  it('rechaza un choque de horario', async () => {
    await login(...VISITANTE)
    expect((await fallo(inscribirse(FOTOGRAFIA_SOLAPA))).message).toBe('Tienes otra inscripción activa en este horario')
  })

  it('rechaza un evento cancelado con 409', async () => {
    await login(...VISITANTE)
    const e = await fallo(inscribirse(VOLUNTARIADO_CANCELADO))
    expect(e.status).toBe(409)
    expect(e.message).toBe('El evento no está disponible')
  })

  it('da 404 si el evento no existe', async () => {
    await login(...VISITANTE)
    const e = await fallo(inscribirse(9999))
    expect(e.status).toBe(404)
    expect(e.message).toBe('El evento no existe')
  })

  it('rechaza un evento que ya comenzó', async () => {
    await login(...VISITANTE)
    expect((await fallo(inscribirse(MERCADO_EN_CURSO))).message).toBe('El evento ya comenzó')
  })

  it('da 403 a un admin', async () => {
    await login(...ADMIN)
    expect((await fallo(inscribirse(FORO))).status).toBe(403)
  })

  it('reutiliza la inscripción al volver a inscribirse', async () => {
    await login(...VISITANTE)
    const i = await inscribirse(FORO)
    await cancelarInscripcion(i.id)
    expect((await inscribirse(FORO)).id).toBe(i.id)
  })

  it('actualiza cupos al inscribirse', async () => {
    await login(...VISITANTE)
    const antes = (await listarEventos({ nombre: 'Foro' })).content[0]
    await inscribirse(FORO)
    const despues = (await listarEventos({ nombre: 'Foro' })).content[0]
    expect(despues.cuposDisponibles).toBe(antes.cuposDisponibles - 1)
    expect(despues.inscritos).toBe(antes.inscritos + 1)
  })
})

describe('asistentes', () => {
  it('agrega y retira un visitante', async () => {
    await login(...ADMIN)
    await agregarInscrito(FORO, 6)
    expect((await listarInscritos(FORO)).content.some((i) => i.usuarioId === 6)).toBe(true)
    await retirarInscrito(FORO, 6)
    expect((await listarInscritos(FORO)).content.some((i) => i.usuarioId === 6)).toBe(false)
  })

  it('aplica las mismas reglas al agregar', async () => {
    await login(...ADMIN)
    expect((await fallo(agregarInscrito(FERIA_LLENA, 6))).message).toBe('El evento está lleno')
  })
})

describe('ubicaciones', () => {
  it('rechaza desactivar con eventos activos', async () => {
    await login(...ADMIN)
    const e = await fallo(desactivarUbicacion(2))
    expect(e.status).toBe(409)
    expect(e.message).toBe('No se puede desactivar: la ubicación tiene eventos activos. Cancélalos o muévelos primero')
  })

  it('desactiva y reactiva una ubicación sin eventos activos', async () => {
    await login(...ADMIN)
    await desactivarUbicacion(8).catch(() => undefined)
    await reactivarUbicacion(8)
    expect((await obtenerUbicacion(8)).activo).toBe(true)
  })

  it('borra las imágenes si el PUT no las envía', async () => {
    await login(...ADMIN)
    const u = await obtenerUbicacion(1)
    expect(u.imagenes.length).toBeGreaterThan(0)
    await actualizarUbicacion(1, { nombre: u.nombre, direccion: u.direccion, capacidad: u.capacidad, imagenes: [] })
    expect((await obtenerUbicacion(1)).imagenes).toEqual([])
  })
})

describe('simulador', () => {
  it('afecta solo a la siguiente inscripción', async () => {
    await login(...VISITANTE)
    simularError('LLENO')
    expect((await fallo(inscribirse(FORO))).message).toBe('El evento está lleno')
    expect((await inscribirse(FORO)).estado).toBe('CONFIRMADA')
  })

  it('simula un 409 sin mensaje', async () => {
    await login(...VISITANTE)
    simularError('SIN_MENSAJE')
    const e = await fallo(inscribirse(FORO))
    expect(e.status).toBe(409)
    expect(e.message).toBe('')
  })
})
