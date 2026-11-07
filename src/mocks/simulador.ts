export type ErrorSimulado = 'EVENTO_NO_EXISTE' | 'NO_DISPONIBLE' | 'YA_INSCRITO' | 'LLENO' | 'HORARIO' | 'SIN_MENSAJE' | 'SERVIDOR'

export const ERRORES_SIMULADOS: { valor: ErrorSimulado; etiqueta: string }[] = [
  { valor: 'EVENTO_NO_EXISTE', etiqueta: 'Evento inexistente (404)' },
  { valor: 'NO_DISPONIBLE', etiqueta: 'Evento no disponible (409)' },
  { valor: 'YA_INSCRITO', etiqueta: 'Ya inscrito (409)' },
  { valor: 'LLENO', etiqueta: 'Evento lleno (409)' },
  { valor: 'HORARIO', etiqueta: 'Choque de horario (409)' },
  { valor: 'SIN_MENSAJE', etiqueta: '409 sin mensaje' },
  { valor: 'SERVIDOR', etiqueta: 'Error del servidor (500)' },
]

let pendiente: ErrorSimulado | null = null

export function simularError(tipo: ErrorSimulado | null) {
  pendiente = tipo
}

export function errorPendiente(): ErrorSimulado | null {
  return pendiente
}

export function consumirError(): ErrorSimulado | null {
  const tipo = pendiente
  pendiente = null
  return tipo
}
