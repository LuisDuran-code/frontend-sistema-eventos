import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { obtenerDb } from '@/mocks/db'
import { entrarComo, renderApp, usarServidor } from '@/test/app'

usarServidor()

const ubicacion = (id: number) => obtenerDb().ubicaciones.find((u) => u.id === id)!

async function abrir() {
  entrarComo('ADMIN')
  renderApp('/admin/ubicaciones')
  await screen.findByText('Sala Norte')
}

const fila = (nombre: string) => screen.getByText(nombre).closest('tr')!

async function editar(nombre: string) {
  await abrir()
  await userEvent.click(within(fila(nombre)).getByRole('button', { name: `Editar ${nombre}` }))
  return screen.findByRole('dialog')
}

async function escribir(etiqueta: string, valor: string) {
  const campo = screen.getByLabelText(etiqueta)
  await userEvent.clear(campo)
  await userEvent.type(campo, valor)
}

describe('tabla de ubicaciones', () => {
  it('muestra nombre, dirección, capacidad, estado y número de eventos', async () => {
    await abrir()
    const f = within(fila('Auditorio Central'))
    expect(f.getByText('Av. Principal 120')).toBeInTheDocument()
    expect(f.getByText('200')).toBeInTheDocument()
    expect(f.getByText('Activa')).toBeInTheDocument()
    expect(await f.findByLabelText('2 eventos')).toBeInTheDocument()
    expect(within(fila('Salón Antiguo')).getByText('Inactiva')).toBeInTheDocument()
  })

  it('desactivar con eventos activos muestra el 409 del backend', async () => {
    await abrir()
    await userEvent.click(within(fila('Sala Norte')).getByRole('button', { name: 'Desactivar Sala Norte' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sí, desactivar' }))
    expect(await screen.findByText(/la ubicación tiene eventos activos/)).toBeInTheDocument()
    expect(ubicacion(2).activo).toBe(true)
  })

  it('desactiva una ubicación libre y ofrece reactivarla', async () => {
    obtenerDb().eventos.find((e) => e.id === 5)!.activo = false
    await abrir()
    await userEvent.click(within(fila('Biblioteca Municipal')).getByRole('button', { name: 'Desactivar Biblioteca Municipal' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sí, desactivar' }))
    expect(await screen.findByText('Ubicación desactivada')).toBeInTheDocument()
    await userEvent.click(await screen.findByRole('button', { name: 'Reactivar Biblioteca Municipal' }))
    expect(await screen.findByText('Ubicación reactivada')).toBeInTheDocument()
    expect(ubicacion(5).activo).toBe(true)
  })
})

describe('formulario de ubicación', () => {
  it('al crear no muestra el Switch y la ubicación nace activa', async () => {
    await abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Nueva ubicación' }))
    await screen.findByRole('dialog')
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    await escribir('Nombre', 'Casa de la Cultura')
    await escribir('Dirección', 'Calle Real 5')
    await escribir('Capacidad máxima', '60')
    await userEvent.click(screen.getByRole('button', { name: 'Crear ubicación' }))
    expect(await screen.findByText('Ubicación creada')).toBeInTheDocument()
    expect(obtenerDb().ubicaciones.at(-1)).toMatchObject({ nombre: 'Casa de la Cultura', activo: true, imagenes: [] })
  })

  it('nombre repetido se muestra en el formulario', async () => {
    await abrir()
    await userEvent.click(screen.getByRole('button', { name: 'Nueva ubicación' }))
    await screen.findByRole('dialog')
    await escribir('Nombre', 'sala norte')
    await escribir('Dirección', 'Calle Real 5')
    await escribir('Capacidad máxima', '60')
    await userEvent.click(screen.getByRole('button', { name: 'Crear ubicación' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe una ubicación con ese nombre')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('exige que la imagen sea https', async () => {
    await editar('Sala Norte')
    await escribir('Imagen principal (URL)', 'http://inseguro.test/a.jpg')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Debe ser una URL https')).toBeInTheDocument()
  })

  it('al editar conserva la galería', async () => {
    ubicacion(2).imagenes = ['https://a', 'https://b']
    await editar('Sala Norte')
    await escribir('Dirección', 'Calle del Norte 9')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Ubicación actualizada')).toBeInTheDocument()
    expect(ubicacion(2)).toMatchObject({ direccion: 'Calle del Norte 9', imagenes: ['https://a', 'https://b'] })
  })

  it('avisa si la capacidad queda por debajo de un cupo, y permite guardar', async () => {
    await editar('Sala Norte')
    await escribir('Capacidad máxima', '20')
    expect(await screen.findByRole('status')).toHaveTextContent('Taller de cerámica (30)')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByText('Ubicación actualizada')).toBeInTheDocument()
    expect(ubicacion(2).capacidad).toBe(20)
  })

  it('no avisa por eventos cancelados', async () => {
    obtenerDb().eventos.find((e) => e.id === 1)!.activo = false
    await editar('Sala Norte')
    await escribir('Capacidad máxima', '20')
    await new Promise((r) => setTimeout(r, 400))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('el Switch apagado desactiva y encendido reactiva', async () => {
    obtenerDb().eventos.find((e) => e.id === 5)!.activo = false
    await editar('Biblioteca Municipal')
    const interruptor = screen.getByRole('switch', { name: 'Ubicación activa' })
    expect(interruptor).toBeChecked()
    await userEvent.click(interruptor)
    await waitFor(() => expect(ubicacion(5).activo).toBe(false))
    await waitFor(() => expect(interruptor).not.toBeChecked())
    await userEvent.click(interruptor)
    await waitFor(() => expect(ubicacion(5).activo).toBe(true))
  })

  it('el Switch se queda encendido si el backend rechaza', async () => {
    await editar('Sala Norte')
    const interruptor = screen.getByRole('switch', { name: 'Ubicación activa' })
    await userEvent.click(interruptor)
    expect(await screen.findByText(/la ubicación tiene eventos activos/)).toBeInTheDocument()
    expect(interruptor).toBeChecked()
  })
})
