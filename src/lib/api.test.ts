import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, esApiCaida, mensajeError, reiniciarRedireccion } from './api'

const fetchMock = vi.fn()
const assign = vi.fn()

function responder(status: number, cuerpo?: unknown) {
  const texto = typeof cuerpo === 'string' ? cuerpo : cuerpo === undefined ? '' : JSON.stringify(cuerpo)
  fetchMock.mockResolvedValueOnce(new Response(status === 204 ? null : texto, { status }))
}

beforeEach(() => {
  fetchMock.mockReset()
  assign.mockReset()
  reiniciarRedireccion()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('location', { pathname: '/eventos', assign })
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
})

describe('peticiones', () => {
  it('usa credenciales y la base /api', async () => {
    responder(200, {})
    await api.get('/eventos')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/eventos')
    expect(init.credentials).toBe('include')
  })

  it('envía el token CSRF decodificado en un post', async () => {
    document.cookie = 'XSRF-TOKEN=abc%3D'
    responder(200, {})
    await api.post('/eventos', {})
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('X-XSRF-TOKEN')).toBe('abc=')
  })

  it('no envía el token CSRF en un get', async () => {
    document.cookie = 'XSRF-TOKEN=abc'
    responder(200, {})
    await api.get('/eventos')
    expect(new Headers(fetchMock.mock.calls[0][1].headers).has('X-XSRF-TOKEN')).toBe(false)
  })

  it('omite params indefinidos y vacíos', async () => {
    responder(200, {})
    await api.get('/eventos', { nombre: '', page: 0, desde: undefined })
    expect(fetchMock.mock.calls[0][0]).toBe('/api/eventos?page=0')
  })

  it('aplana la página que serializa Spring', async () => {
    responder(200, { content: [{ id: 1 }], page: { size: 10, number: 2, totalElements: 21, totalPages: 3 } })
    await expect(api.get('/eventos')).resolves.toEqual({ content: [{ id: 1 }], size: 10, number: 2, totalElements: 21, totalPages: 3 })
  })

  it('no toca un objeto que solo tiene un campo page', async () => {
    responder(200, { page: 3 })
    await expect(api.get('/algo')).resolves.toEqual({ page: 3 })
  })

  it('envía un archivo sin fijar Content-Type ni convertirlo a JSON', async () => {
    responder(201, { url: 'https://a' })
    document.cookie = 'XSRF-TOKEN=token'
    const cuerpo = new FormData()
    await api.post('/imagenes', cuerpo)
    const opciones = fetchMock.mock.calls[0][1]
    expect(opciones.body).toBe(cuerpo)
    expect(opciones.headers.has('Content-Type')).toBe(false)
    expect(opciones.headers.get('X-XSRF-TOKEN')).toBe('token')
  })

  it('resuelve undefined con un 204', async () => {
    responder(204)
    await expect(api.del('/eventos/1')).resolves.toBeUndefined()
  })
})

describe('errores', () => {
  it('convierte un 409 con mensaje en ApiError', async () => {
    responder(409, { message: 'El evento está lleno' })
    const e = await api.post('/inscripciones', {}).catch((x) => x)
    expect(e).toBeInstanceOf(ApiError)
    expect(e.status).toBe(409)
    expect(e.message).toBe('El evento está lleno')
  })

  it('deja el mensaje vacío si Spring no lo incluye', async () => {
    responder(409, { status: 409, error: 'Conflict' })
    const e = await api.post('/inscripciones', {}).catch((x) => x)
    expect(e.status).toBe(409)
    expect(e.message).toBe('')
  })

  it('un fallo de red da status 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const e = await api.get('/auth/me').catch((x) => x)
    expect(e.status).toBe(0)
    expect(esApiCaida(e)).toBe(true)
  })

  it('un 500 sin JSON da status 0', async () => {
    responder(500, '')
    const e = await api.get('/auth/me').catch((x) => x)
    expect(e.status).toBe(0)
  })

  it('un 500 con JSON conserva el status', async () => {
    responder(500, { error: 'Internal Server Error' })
    const e = await api.get('/eventos').catch((x) => x)
    expect(e.status).toBe(500)
    expect(esApiCaida(e)).toBe(false)
  })

  it('no muestra el detalle técnico de un 500', async () => {
    responder(500, { message: 'could not execute statement [ERROR: relation]' })
    await expect(api.get('/x')).rejects.toMatchObject({ status: 500, message: '' })
  })

  it.each(["Validation failed for object='eventoRequestDto'. Error count: 1", 'JSON parse error: Unexpected token'])(
    'no muestra el texto de Spring en un 400: %s',
    async (message) => {
      responder(400, { message })
      await expect(api.post('/x', {})).rejects.toMatchObject({ status: 400, message: '' })
    },
  )

  it('conserva el mensaje de negocio de un 400', async () => {
    responder(400, { message: 'La hora de fin debe ser posterior a la de inicio' })
    await expect(api.post('/x', {})).rejects.toMatchObject({ status: 400, message: 'La hora de fin debe ser posterior a la de inicio' })
  })

  it('un 502 da status 0', async () => {
    responder(502, { error: 'Bad Gateway' })
    const e = await api.get('/eventos').catch((x) => x)
    expect(e.status).toBe(0)
  })
})

describe('401', () => {
  it('redirige a /login', async () => {
    responder(401)
    await api.get('/eventos').catch(() => undefined)
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('redirige una sola vez con dos 401 seguidos', async () => {
    responder(401)
    responder(401)
    await Promise.all([api.get('/eventos').catch(() => 0), api.get('/ubicaciones').catch(() => 0)])
    expect(assign).toHaveBeenCalledTimes(1)
  })

  it('no redirige si ya está en /login', async () => {
    vi.stubGlobal('location', { pathname: '/login', assign })
    responder(401)
    await api.get('/eventos').catch(() => undefined)
    expect(assign).not.toHaveBeenCalled()
  })

  it.each(['/auth/login', '/auth/me'])('no redirige en %s', async (ruta) => {
    responder(401, { message: 'Credenciales inválidas' })
    const e = await api.post(ruta, {}).catch((x) => x)
    expect(e.status).toBe(401)
    expect(assign).not.toHaveBeenCalled()
  })
})

describe('mensajeError', () => {
  it('prioriza el mensaje del error', () => {
    expect(mensajeError(new ApiError(409, 'Del backend'), { 409: 'Por estado' }, 'Genérico')).toBe('Del backend')
  })

  it('usa el texto por estado sin mensaje', () => {
    expect(mensajeError(new ApiError(404, ''), { 404: 'Por estado' }, 'Genérico')).toBe('Por estado')
  })

  it('usa el genérico en otro caso', () => {
    expect(mensajeError(new Error('x'), {}, 'Genérico')).toBe('Genérico')
  })
})
