import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { obtenerDb } from '@/mocks/db'
import { entrarComo, renderApp, rutaActual, usarServidor } from '@/test/app'

usarServidor()

const fila = async (nombre: string) => (await screen.findByText(nombre)).closest('tr')!

async function abrirAcciones(nombre: string) {
  const f = await fila(nombre)
  await userEvent.click(within(f).getByRole('button', { name: `Acciones de ${nombre}` }))
}

async function abrirNuevo() {
  entrarComo('ADMIN')
  renderApp('/admin/eventos')
  await userEvent.click(await screen.findByRole('button', { name: 'Nuevo evento' }))
  return screen.findByRole('dialog')
}

async function elegirUbicacion(nombre: string) {
  await userEvent.click(await screen.findByRole('combobox', { name: 'Ubicación' }))
  await userEvent.click(await screen.findByRole('option', { name: nombre }))
}

async function llenar({ dia, inicio, fin, cupo }: { dia: string; inicio: string; fin: string; cupo: string }) {
  await userEvent.type(screen.getByLabelText('Nombre'), 'Evento de prueba')
  await userEvent.click(screen.getByRole('button', { name: 'Fecha' }))
  await userEvent.click(await screen.findByRole('gridcell', { name: dia }))
  fireEvent.change(screen.getByLabelText('Hora de inicio'), { target: { value: inicio } })
  fireEvent.change(screen.getByLabelText('Hora de fin'), { target: { value: fin } })
  await userEvent.clear(screen.getByLabelText('Cupo'))
  await userEvent.type(screen.getByLabelText('Cupo'), cupo)
}

describe('tabla de eventos', () => {
  it('muestra nombre, horario, ubicación y ocupación', async () => {
    entrarComo('ADMIN')
    renderApp('/admin/eventos')
    const f = await fila('Foro de empleo joven')
    expect(within(f).getByText('mar 10 nov 2026, 09:00 a 13:00')).toBeInTheDocument()
    expect(within(f).getByText('Auditorio Central')).toBeInTheDocument()
    expect(within(f).getByText('1 / 200')).toBeInTheDocument()
  })

  it('busca en el servidor y lo refleja en la URL', async () => {
    entrarComo('ADMIN')
    renderApp('/admin/eventos')
    await screen.findByText('Foro de empleo joven')
    await userEvent.type(screen.getByLabelText('Buscar por nombre'), 'ajedrez')
    expect(await screen.findByText('Maratón de ajedrez')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('Foro de empleo joven')).not.toBeInTheDocument())
    expect(rutaActual()).toContain('q=ajedrez')
  })

  it('marca el evento cancelado y explica por qué no se edita', async () => {
    entrarComo('ADMIN')
    renderApp('/admin/eventos')
    const f = await fila('Jornada de voluntariado')
    expect(within(f).getByText('Cancelado')).toBeInTheDocument()
    await abrirAcciones('Jornada de voluntariado')
    const editar = await screen.findByRole('menuitem', { name: /Editar/ })
    expect(editar).toHaveAttribute('aria-disabled', 'true')
    expect(editar).toHaveTextContent('No se puede editar un evento cancelado')
    const cancelar = screen.getByRole('menuitem', { name: /Cancelar evento/ })
    expect(cancelar).toHaveAttribute('aria-disabled', 'true')
    expect(cancelar).toHaveTextContent('Este evento ya está cancelado')
  })

  it('explica por qué no se edita un evento comenzado con inscritos', async () => {
    entrarComo('ADMIN')
    renderApp('/admin/eventos')
    await abrirAcciones('Charla de astronomía')
    const editar = await screen.findByRole('menuitem', { name: /Editar/ })
    expect(editar).toHaveAttribute('aria-disabled', 'true')
    expect(editar).toHaveTextContent('Ya comenzó y tiene inscritos')
  })

  it('ofrece ver, editar, gestionar asistentes y cancelar', async () => {
    entrarComo('ADMIN')
    renderApp('/admin/eventos')
    await abrirAcciones('Foro de empleo joven')
    const opciones = (await screen.findAllByRole('menuitem')).map((o) => o.textContent)
    expect(opciones).toEqual(['Ver', 'Editar', 'Gestionar asistentes', 'Cancelar evento'])
    await userEvent.click(screen.getByRole('menuitem', { name: 'Gestionar asistentes' }))
    expect(rutaActual()).toBe('/admin/eventos/2/asistentes')
  })
})

describe('formulario de evento', () => {
  it('solo ofrece ubicaciones activas', async () => {
    await abrirNuevo()
    await userEvent.click(await screen.findByRole('combobox', { name: 'Ubicación' }))
    expect(await screen.findByRole('option', { name: 'Sala Norte' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Salón Antiguo/ })).not.toBeInTheDocument()
  })

  it('muestra la capacidad y rechaza un cupo mayor sin enviar', async () => {
    await abrirNuevo()
    await elegirUbicacion('Jardín Botánico')
    expect(screen.getByText('Capacidad máxima: 80')).toBeInTheDocument()
    const antes = obtenerDb().eventos.length
    await llenar({ dia: '20', inicio: '10:00', fin: '11:00', cupo: '81' })
    await userEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
    expect(await screen.findByText('No puede superar la capacidad máxima (80)')).toBeInTheDocument()
    expect(obtenerDb().eventos).toHaveLength(antes)
  })

  it('crea el evento y cierra el panel', async () => {
    await abrirNuevo()
    await elegirUbicacion('Jardín Botánico')
    await llenar({ dia: '20', inicio: '10:00', fin: '11:00', cupo: '50' })
    await userEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
    expect(await screen.findByText('Evento creado')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(obtenerDb().eventos.at(-1)).toMatchObject({ nombre: 'Evento de prueba', fecha: '2026-11-20', horaInicio: '10:00:00', cupo: 50 })
  })

  it('muestra el choque de horario en el formulario y sigue abierto', async () => {
    await abrirNuevo()
    await elegirUbicacion('Sala Norte')
    await llenar({ dia: '8', inicio: '15:00', fin: '17:00', cupo: '10' })
    await userEvent.click(screen.getByRole('button', { name: 'Crear evento' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El evento choca en horario con otro evento en la misma ubicación')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('con inscritos bloquea fecha, horas y ubicación y lo explica', async () => {
    entrarComo('ADMIN')
    renderApp('/admin/eventos')
    await abrirAcciones('Foro de empleo joven')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    await screen.findByRole('dialog')
    expect(screen.getByRole('button', { name: 'Fecha' })).toBeDisabled()
    expect(screen.getByLabelText('Hora de inicio')).toBeDisabled()
    expect(screen.getByLabelText('Hora de fin')).toBeDisabled()
    expect(screen.getByRole('combobox', { name: 'Ubicación' })).toBeDisabled()
    expect(screen.getByText(/ya tiene inscritos/)).toBeInTheDocument()
  })

  it('no deja bajar el cupo de los inscritos y guarda los demás cambios', async () => {
    entrarComo('ADMIN')
    renderApp('/admin/eventos')
    await abrirAcciones('Taller de cerámica')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    const cupo = await screen.findByLabelText('Cupo')
    await userEvent.clear(cupo)
    await userEvent.type(cupo, '2')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('No puede ser menor que los inscritos actuales (3)')).toBeInTheDocument()
    await userEvent.clear(cupo)
    await userEvent.type(cupo, '20')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Evento actualizado')).toBeInTheDocument()
    expect(obtenerDb().eventos[0]).toMatchObject({ cupo: 20, horaInicio: '14:00:00' })
  })

  it('al editar incluye la ubicación actual inactiva, marcada', async () => {
    obtenerDb().ubicaciones.find((u) => u.id === 6)!.activo = false
    entrarComo('ADMIN')
    renderApp('/admin/eventos?q=concierto')
    await abrirAcciones('Concierto de cámara')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    await userEvent.click(await screen.findByRole('combobox', { name: 'Ubicación' }))
    expect(await screen.findByRole('option', { name: 'Teatro del Parque (inactiva)' })).toBeInTheDocument()
  })
})

describe('cancelar evento', () => {
  it('avisa de las inscripciones y cancela', async () => {
    entrarComo('ADMIN')
    renderApp('/admin/eventos')
    await abrirAcciones('Taller de cerámica')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Cancelar evento' }))
    const aviso = await screen.findByRole('alertdialog')
    expect(aviso).toHaveTextContent('También se cancelarán sus 3 inscripciones')
    await userEvent.click(within(aviso).getByRole('button', { name: 'Sí, cancelar evento' }))
    expect(await screen.findByText('Evento cancelado')).toBeInTheDocument()
    expect(within(await fila('Taller de cerámica')).getByText('Cancelado')).toBeInTheDocument()
    expect(obtenerDb().inscripciones.filter((i) => i.eventoId === 1 && i.estado === 'CONFIRMADA')).toHaveLength(0)
  })
})
