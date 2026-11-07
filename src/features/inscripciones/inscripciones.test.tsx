import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { obtenerDb } from '@/mocks/db'
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

  it('anima el número de cupos solo cuando cambia, no sobre el dato viejo', async () => {
    let retener: Promise<void> | undefined
    let soltar = () => {}
    server.use(
      http.get(`*/api/eventos/${FORO}`, async () => {
        await retener
      }),
    )
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    await screen.findByText('Quedan 199 cupos')
    const dialogo = await abrirConfirmacion()
    retener = new Promise((resolver) => {
      soltar = resolver
    })
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Confirmar inscripción' }))
    await screen.findByText('Te inscribiste en el evento')
    expect(screen.getByText('Quedan 199 cupos')).not.toHaveClass('animate-dato-cambia')
    soltar()
    expect(await screen.findByText('Quedan 198 cupos')).toHaveClass('animate-dato-cambia')
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

describe('asistencia en eventos ya comenzados', () => {
  it('en un evento terminado no ofrece cancelar y dice por qué', async () => {
    entrarComo('VISITANTE')
    renderApp('/mis-inscripciones')
    const fila = (await screen.findByText('Charla de astronomía')).closest('tr')!
    expect(within(fila).getByRole('button', { name: 'Cancelar asistencia' })).toBeDisabled()
    expect(within(fila).getByText('El evento ya terminó')).toBeInTheDocument()
    expect(within(fila).getByText('Finalizado')).toBeInTheDocument()
  })

  it('en un evento en curso no ofrece cancelar y dice por qué', async () => {
    obtenerDb().inscripciones.push({ id: 50, usuarioId: 2, eventoId: 7, estado: 'CONFIRMADA', fechaInscripcion: '2026-11-05T09:30:00' })
    entrarComo('VISITANTE')
    renderApp('/mis-inscripciones')
    const fila = (await screen.findByText('Mercado de artesanos')).closest('tr')!
    expect(within(fila).getByRole('button', { name: 'Cancelar asistencia' })).toBeDisabled()
    expect(within(fila).getByText('El evento ya comenzó')).toBeInTheDocument()
  })
})

describe('paginación al quedar vacía', () => {
  it('vuelve a la última página con filas al cancelar la única de la página', async () => {
    const db = obtenerDb()
    ;[2, 3, 4, 6, 10, 11, 12, 13, 14].forEach((eventoId, i) =>
      db.inscripciones.push({ id: 100 + i, usuarioId: 2, eventoId, estado: 'CONFIRMADA', fechaInscripcion: '2026-11-05T09:30:00' }),
    )
    entrarComo('VISITANTE')
    renderApp('/mis-inscripciones')
    await screen.findByText('Taller de cerámica')
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    const fila = (await screen.findByText('Muestra de teatro escolar')).closest('tr')!
    await userEvent.click(within(fila).getByRole('button', { name: 'Cancelar asistencia' }))
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Sí, cancelar' }))
    expect(await screen.findByText('Taller de cerámica')).toBeInTheDocument()
    expect(screen.queryByText('No tienes inscripciones activas')).not.toBeInTheDocument()
  })
})
