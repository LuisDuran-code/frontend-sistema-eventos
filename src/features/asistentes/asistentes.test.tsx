import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { obtenerDb } from '@/mocks/db'
import { server } from '@/mocks/server'
import { simularError } from '@/mocks/simulador'
import { entrarComo, renderApp, usarServidor } from '@/test/app'

usarServidor()

const abrir = async (id: number) => {
  entrarComo('ADMIN')
  renderApp(`/admin/eventos/${id}/asistentes`)
  return screen.findByRole('heading', { level: 1 })
}

async function abrirDialogo() {
  await userEvent.click(await screen.findByRole('button', { name: 'Agregar asistente' }))
  return screen.findByRole('dialog')
}

const confirmados = (eventoId: number) => obtenerDb().inscripciones.filter((i) => i.eventoId === eventoId && i.estado === 'CONFIRMADA')

describe('asistentes', () => {
  it('muestra los datos del evento y su ocupación', async () => {
    expect(await abrir(1)).toHaveTextContent('Taller de cerámica')
    expect(await screen.findByText('3 / 30')).toBeInTheDocument()
    expect(screen.getByText(/Sala Norte/)).toBeInTheDocument()
  })

  it('lista nombre, correo, registro y sello', async () => {
    await abrir(1)
    const fila = (await screen.findByText('Marta Rivas')).closest('tr')!
    expect(within(fila).getByText('marta@aforo.test')).toBeInTheDocument()
    expect(within(fila).getByText('jue 5 nov 2026, 09:30')).toBeInTheDocument()
    expect(within(fila).getByText('Inscrito')).toBeInTheDocument()
  })

  it('busca por nombre o correo y excluye a los inscritos', async () => {
    await abrir(1)
    await screen.findByText('Marta Rivas')
    const dialogo = await abrirDialogo()
    expect(await within(dialogo).findByRole('option', { name: /Lucía Campos/ })).toBeInTheDocument()
    expect(within(dialogo).queryByRole('option', { name: /Marta Rivas/ })).not.toBeInTheDocument()
    expect(within(dialogo).queryByRole('option', { name: /Administración/ })).not.toBeInTheDocument()
    await userEvent.type(within(dialogo).getByLabelText('Buscar persona'), 'pablo@')
    await waitFor(() => expect(within(dialogo).queryByRole('option', { name: /Lucía Campos/ })).not.toBeInTheDocument())
    expect(within(dialogo).getByRole('option', { name: /Pablo Ortiz/ })).toBeInTheDocument()
  })

  it('agrega a la persona elegida y cierra', async () => {
    await abrir(1)
    await screen.findByText('Marta Rivas')
    const dialogo = await abrirDialogo()
    await userEvent.click(await within(dialogo).findByRole('option', { name: /Lucía Campos/ }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Agregar' }))
    expect(await screen.findByText('Asistente agregado')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('4 / 30')).toBeInTheDocument()
    expect(await screen.findByText('lucia@aforo.test')).toBeInTheDocument()
  })

  it('un 409 al agregar se muestra en toast y deja el Dialog abierto', async () => {
    await abrir(1)
    await screen.findByText('Marta Rivas')
    const dialogo = await abrirDialogo()
    await userEvent.click(await within(dialogo).findByRole('option', { name: /Lucía Campos/ }))
    simularError('LLENO')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Agregar' }))
    expect(await screen.findByText('El evento está lleno')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('retirar pide confirmación y actualiza la tabla', async () => {
    await abrir(1)
    const fila = (await screen.findByText('Marta Rivas')).closest('tr')!
    await userEvent.click(within(fila).getByRole('button', { name: 'Retirar a Marta Rivas' }))
    const aviso = await screen.findByRole('alertdialog')
    expect(confirmados(1)).toHaveLength(3)
    await userEvent.click(within(aviso).getByRole('button', { name: 'Sí, retirar' }))
    expect(await screen.findByText('Asistente retirado')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByText('marta@aforo.test')).not.toBeInTheDocument())
    expect(await screen.findByText('2 / 30')).toBeInTheDocument()
  })

  it('un 404 sin mensaje al agregar avisa sin ocultar la acción', async () => {
    server.use(http.post('*/api/eventos/:id/inscritos', () => HttpResponse.json({ status: 404, error: 'Not Found' }, { status: 404 })))
    await abrir(1)
    await screen.findByText('Marta Rivas')
    const dialogo = await abrirDialogo()
    await userEvent.click(await within(dialogo).findByRole('option', { name: /Lucía Campos/ }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Agregar' }))
    expect(await screen.findByText('El evento no está disponible')).toBeInTheDocument()
  })

  it('un 404 sin mensaje al retirar avisa sin ocultar la acción', async () => {
    server.use(http.delete('*/api/eventos/:id/inscritos/:usuarioId', () => HttpResponse.json({ status: 404, error: 'Not Found' }, { status: 404 })))
    await abrir(1)
    const fila = (await screen.findByText('Marta Rivas')).closest('tr')!
    await userEvent.click(within(fila).getByRole('button', { name: 'Retirar a Marta Rivas' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sí, retirar' }))
    expect(await screen.findByText('El evento no está disponible')).toBeInTheDocument()
    expect(within(fila).getByRole('button', { name: 'Retirar a Marta Rivas' })).toBeInTheDocument()
  })

  it.each([
    [4, 'El evento está lleno'],
    [8, 'El evento ya terminó'],
    [9, 'Este evento fue cancelado'],
  ])('deshabilita agregar en el evento %i con su motivo', async (id, motivo) => {
    await abrir(id)
    expect(await screen.findByRole('button', { name: 'Agregar asistente' })).toBeDisabled()
    expect(screen.getByText(motivo)).toBeInTheDocument()
  })

  it('explica cuando no hay nadie inscrito', async () => {
    await abrir(3)
    expect(await screen.findByText('Todavía no hay asistentes')).toBeInTheDocument()
  })

  it('muestra el error si el evento no existe', async () => {
    entrarComo('ADMIN')
    renderApp('/admin/eventos/999/asistentes')
    expect(await screen.findByText('Evento no encontrado')).toBeInTheDocument()
  })

  it('al retirar a la única persona de la página vuelve a la anterior', async () => {
    const db = obtenerDb()
    for (let n = 0; n < 11; n++) {
      db.usuarios.push({ id: 100 + n, nombre: `Persona ${n}`, email: `p${n}@aforo.test`, password: 'x', rol: 'VISITANTE' })
      db.inscripciones.push({ id: 200 + n, usuarioId: 100 + n, eventoId: 3, estado: 'CONFIRMADA', fechaInscripcion: '2026-11-05T09:30:00' })
    }
    await abrir(3)
    await screen.findByText('Persona 0')
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    await userEvent.click(await screen.findByRole('button', { name: 'Retirar a Persona 10' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sí, retirar' }))
    expect(await screen.findByText('Persona 0')).toBeInTheDocument()
    expect(screen.queryByText('Todavía no hay asistentes')).not.toBeInTheDocument()
  })

  it('el selector ve a todas las personas aunque superen una página', async () => {
    const db = obtenerDb()
    for (let n = 0; n < 70; n++) {
      db.usuarios.push({ id: 100 + n, nombre: `Persona ${n}`, email: `p${n}@aforo.test`, password: 'x', rol: 'VISITANTE' })
      if (n < 60) db.inscripciones.push({ id: 300 + n, usuarioId: 100 + n, eventoId: 3, estado: 'CONFIRMADA', fechaInscripcion: '2026-11-05T09:30:00' })
    }
    await abrir(3)
    await screen.findByText('Persona 0')
    const dialogo = await abrirDialogo()
    expect(await within(dialogo).findByRole('option', { name: /Persona 65/ })).toBeInTheDocument()
    expect(within(dialogo).queryByRole('option', { name: /Persona 55/ })).not.toBeInTheDocument()
  })

  it('si no carga la lista de personas lo dice en vez de fingir que nadie coincide', async () => {
    server.use(http.get('*/api/usuarios', () => HttpResponse.json({ status: 500 }, { status: 500 })))
    await abrir(1)
    await screen.findByText('Marta Rivas')
    const dialogo = await abrirDialogo()
    expect(await within(dialogo).findByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    expect(within(dialogo).queryByText('Nadie coincide con la búsqueda')).not.toBeInTheDocument()
  })
})
