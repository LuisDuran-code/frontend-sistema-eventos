import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { simularError } from '@/mocks/simulador'
import { entrarComo, renderApp, usarServidor } from '@/test/app'

usarServidor()

const FORO = 2

function contarPeticiones(metodo: string, tramo: string) {
  const conteo = { valor: 0 }
  server.events.on('request:start', ({ request }) => {
    if (request.method === metodo && new URL(request.url).pathname.includes(tramo)) conteo.valor += 1
  })
  return conteo
}

async function abrirConfirmacion() {
  await userEvent.click(await screen.findByRole('button', { name: 'Inscribirme' }))
  return screen.findByRole('alertdialog')
}

describe('inscribirse', () => {
  it('ofrece Inscribirme al visitante', async () => {
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    expect(await screen.findByRole('button', { name: 'Inscribirme' })).toBeEnabled()
  })

  it('ofrece Gestionar asistentes al admin', async () => {
    entrarComo('ADMIN')
    renderApp(`/eventos/${FORO}`)
    expect(await screen.findByRole('link', { name: 'Gestionar asistentes' })).toHaveAttribute('href', `/admin/eventos/${FORO}/asistentes`)
    expect(screen.queryByRole('button', { name: 'Inscribirme' })).not.toBeInTheDocument()
  })

  it.each([
    [4, 'El evento está lleno'],
    [1, 'Ya estás inscrito en este evento'],
    [7, 'El evento ya comenzó'],
    [8, 'El evento ya terminó'],
  ])('deshabilita el evento %i con su motivo', async (id, motivo) => {
    entrarComo('VISITANTE')
    renderApp(`/eventos/${id}`)
    expect(await screen.findByText(motivo)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Inscribirme' })).toBeDisabled()
  })

  it('un doble clic envía una sola petición', async () => {
    entrarComo('VISITANTE')
    const posts = contarPeticiones('POST', '/inscripciones')
    renderApp(`/eventos/${FORO}`)
    const dialogo = await abrirConfirmacion()
    await userEvent.dblClick(within(dialogo).getByRole('button', { name: 'Confirmar inscripción' }))
    await screen.findByText('Te inscribiste en el evento')
    expect(posts.valor).toBe(1)
    server.events.removeAllListeners()
  })

  it('sella y actualiza los cupos en su sitio', async () => {
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    expect(await screen.findByText('1 / 200')).toBeInTheDocument()
    const dialogo = await abrirConfirmacion()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar inscripción' }))
    expect(await screen.findByText('2 / 200')).toBeInTheDocument()
    expect(await screen.findByText('Inscrito')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
  })

  it('muestra el mensaje del backend en un toast', async () => {
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    const dialogo = await abrirConfirmacion()
    simularError('HORARIO')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar inscripción' }))
    expect(await screen.findByText('Tienes otra inscripción activa en este horario')).toBeInTheDocument()
  })

  it('usa el texto genérico sin mensaje', async () => {
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    const dialogo = await abrirConfirmacion()
    simularError('SIN_MENSAJE')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar inscripción' }))
    expect(await screen.findByText('No se pudo completar la inscripción')).toBeInTheDocument()
  })
})

describe('mis inscripciones', () => {
  it('separa activas y canceladas', async () => {
    entrarComo('VISITANTE')
    renderApp('/mis-inscripciones')
    expect(await screen.findByRole('link', { name: 'Taller de cerámica' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Club de lectura abierto' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Canceladas' }))
    expect(await screen.findByRole('link', { name: 'Club de lectura abierto' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar asistencia' })).not.toBeInTheDocument()
  })

  it('cancela tras confirmar y mueve la fila', async () => {
    entrarComo('VISITANTE')
    const borrados = contarPeticiones('DELETE', '/inscripciones/1')
    renderApp('/mis-inscripciones')
    const fila = (await screen.findByRole('link', { name: 'Taller de cerámica' })).closest('tr')!
    await userEvent.click(within(fila).getByRole('button', { name: 'Cancelar asistencia' }))
    const dialogo = await screen.findByRole('alertdialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Sí, cancelar' }))
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Taller de cerámica' })).not.toBeInTheDocument())
    expect(borrados.valor).toBe(1)
    await userEvent.click(screen.getByRole('tab', { name: 'Canceladas' }))
    expect(await screen.findByRole('link', { name: 'Taller de cerámica' })).toBeInTheDocument()
    server.events.removeAllListeners()
  })
})
