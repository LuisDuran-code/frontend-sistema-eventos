import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { entrarComo, renderApp, rutaActual, usarServidor } from '@/test/app'

usarServidor()

describe('cartelera', () => {
  it('muestra Skeleton mientras carga', async () => {
    entrarComo('VISITANTE')
    renderApp('/eventos')
    expect(await screen.findByLabelText('Cargando eventos')).toBeInTheDocument()
    await screen.findByText('Taller de cerámica')
  })

  it('muestra los datos de la tarjeta', async () => {
    entrarComo('VISITANTE')
    renderApp('/eventos')
    const tarjeta = (await screen.findByText('Foro de empleo joven')).closest('article')!
    expect(within(tarjeta).getByText('mar 10 nov 2026, 09:00 a 13:00')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Auditorio Central')).toBeInTheDocument()
    expect(within(tarjeta).getByText('199 cupos')).toBeInTheDocument()
  })

  it('marca lo que es del usuario y lo que está lleno', async () => {
    entrarComo('VISITANTE')
    renderApp('/eventos')
    const propia = (await screen.findByText('Taller de cerámica')).closest('article')!
    expect(await within(propia).findByText('Inscrito')).toBeInTheDocument()
    const llena = screen.getByText('Feria de ciencias').closest('article')!
    expect(within(llena).getAllByText('Lleno').length).toBeGreaterThan(0)
  })

  it('busca por nombre en el servidor', async () => {
    entrarComo('VISITANTE')
    renderApp('/eventos')
    await userEvent.type(await screen.findByLabelText('Buscar por título'), 'cerámica')
    await waitFor(() => expect(screen.queryByText('Foro de empleo joven')).not.toBeInTheDocument())
    expect(rutaActual()).toContain('q=cer')
  })

  it('vuelve a la primera página al filtrar', async () => {
    entrarComo('VISITANTE')
    renderApp('/eventos?page=1')
    await userEvent.type(await screen.findByLabelText('Buscar por título'), 'cerámica')
    expect(await screen.findByText('Taller de cerámica')).toBeInTheDocument()
    expect(rutaActual()).not.toContain('page=')
  })

  it('filtra por ubicación', async () => {
    entrarComo('VISITANTE')
    renderApp('/eventos?page=1')
    await userEvent.click(await screen.findByRole('combobox', { name: 'Ubicación' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Sala Norte' }))
    expect(await screen.findByText('Taller de cerámica')).toBeInTheDocument()
    expect(rutaActual()).not.toContain('page=')
    expect(rutaActual()).toContain('ubicacion=2')
  })

  it('distingue sin resultados de sin eventos', async () => {
    entrarComo('VISITANTE')
    renderApp('/eventos?q=zzz')
    expect(await screen.findByText('No hay eventos con esos filtros')).toBeInTheDocument()
  })

  it('muestra el vacío sin eventos', async () => {
    entrarComo('VISITANTE')
    server.use(http.get('*/api/eventos', () => HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 12 })))
    renderApp('/eventos')
    expect(await screen.findByText('Aún no hay eventos')).toBeInTheDocument()
  })

  it('permite reintentar tras un error', async () => {
    entrarComo('VISITANTE')
    server.use(http.get('*/api/eventos', () => HttpResponse.json({ status: 500 }, { status: 500 }), { once: true }))
    renderApp('/eventos')
    await userEvent.click(await screen.findByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Taller de cerámica')).toBeInTheDocument()
  })
})

describe('detalle', () => {
  it('muestra capacidad, horario y barra de cupos', async () => {
    entrarComo('VISITANTE')
    renderApp('/eventos/1')
    expect(await screen.findByRole('heading', { name: 'Taller de cerámica' })).toBeInTheDocument()
    expect(screen.getByText('dom 8 nov 2026, 14:00 a 16:00')).toBeInTheDocument()
    expect(await screen.findByText('Capacidad del lugar: 30 personas')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByText('3 / 30')).toBeInTheDocument()
  })

  it('usa el texto del caso de uso en un 404 sin mensaje', async () => {
    entrarComo('VISITANTE')
    server.use(http.get('*/api/eventos/:id', () => HttpResponse.json({ status: 404 }, { status: 404 })))
    renderApp('/eventos/99')
    expect(await screen.findByText('El evento no está disponible')).toBeInTheDocument()
  })
})
