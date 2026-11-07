export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type Params = Record<string, string | number | undefined>

const BASE = import.meta.env.VITE_API_URL ?? '/api'
const SIN_REDIRECCION = ['/auth/login', '/auth/me']

let redirigiendo = false

export function reiniciarRedireccion() {
  redirigiendo = false
}

function leerCookie(nombre: string): string | null {
  const par = document.cookie.split('; ').find((c) => c.startsWith(`${nombre}=`))
  return par ? decodeURIComponent(par.slice(nombre.length + 1)) : null
}

function construirUrl(path: string, params?: Params): string {
  const query = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== '') query.set(clave, String(valor))
  })
  const texto = query.toString()
  return `${BASE}${path}${texto ? `?${texto}` : ''}`
}

function leerJson(texto: string): Record<string, unknown> | null {
  try {
    const valor = JSON.parse(texto)
    return typeof valor === 'object' && valor !== null ? valor : null
  } catch {
    return null
  }
}

async function peticion<T>(metodo: string, path: string, opciones: { params?: Params; body?: unknown } = {}): Promise<T> {
  const headers = new Headers()
  if (opciones.body !== undefined) headers.set('Content-Type', 'application/json')
  if (metodo !== 'GET') {
    const token = leerCookie('XSRF-TOKEN')
    if (token) headers.set('X-XSRF-TOKEN', token)
  }

  let respuesta: Response
  try {
    respuesta = await fetch(construirUrl(path, opciones.params), {
      method: metodo,
      credentials: 'include',
      headers,
      body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
    })
  } catch {
    throw new ApiError(0, '')
  }

  const texto = await respuesta.text()
  const json = leerJson(texto)

  if (respuesta.ok) return (texto ? (json ?? texto) : undefined) as T

  if (respuesta.status === 401 && !SIN_REDIRECCION.includes(path) && !redirigiendo && location.pathname !== '/login') {
    redirigiendo = true
    location.assign('/login')
  }

  const pasarela = [502, 503, 504].includes(respuesta.status)
  const proxySinApi = respuesta.status >= 500 && json === null
  const status = pasarela || proxySinApi ? 0 : respuesta.status
  throw new ApiError(status, typeof json?.message === 'string' ? json.message : '')
}

export const api = {
  get: <T>(path: string, params?: Params) => peticion<T>('GET', path, { params }),
  post: <T>(path: string, body?: unknown) => peticion<T>('POST', path, { body }),
  put: <T>(path: string, body: unknown) => peticion<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => peticion<T>('PATCH', path, { body }),
  del: <T = void>(path: string) => peticion<T>('DELETE', path),
}

export function esApiCaida(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0
}

export function mensajeError(error: unknown, porEstado: Partial<Record<number, string>>, generico: string): string {
  if (error instanceof ApiError) return error.message || porEstado[error.status] || generico
  return generico
}
