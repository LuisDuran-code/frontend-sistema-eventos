import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { entrarComo, renderApp, rutaActual, usarServidor } from '@/test/app'

usarServidor()

async function escribirCredenciales(correo: string, clave: string) {
  await userEvent.type(await screen.findByLabelText('Correo'), correo)
  await userEvent.type(screen.getByLabelText('Contraseña'), clave)
  await userEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
}

describe('sesión y rutas', () => {
  it('lleva a /login sin sesión', async () => {
    renderApp('/eventos')
    await waitFor(() => expect(rutaActual()).toBe('/login'))
  })

  it('valida el formulario antes de enviar', async () => {
    renderApp('/login')
    await userEvent.click(await screen.findByRole('button', { name: 'Iniciar sesión' }))
    expect(await screen.findByText('Escribe un correo válido')).toBeInTheDocument()
  })

  it('muestra credenciales incorrectas en el formulario', async () => {
    renderApp('/login')
    await escribirCredenciales('admin@aforo.test', 'mala')
    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas')
    expect(rutaActual()).toBe('/login')
  })

  it('lleva al admin a /admin/eventos', async () => {
    renderApp('/login')
    await escribirCredenciales('admin@aforo.test', 'admin1234')
    await waitFor(() => expect(rutaActual()).toBe('/admin/eventos'))
  })

  it('lleva al visitante a /eventos', async () => {
    renderApp('/login')
    await escribirCredenciales('visitante@aforo.test', 'visitante1234')
    await waitFor(() => expect(rutaActual()).toBe('/eventos'))
  })

  it('redirige /login según el rol con sesión', async () => {
    entrarComo('ADMIN')
    renderApp('/login')
    await waitFor(() => expect(rutaActual()).toBe('/admin/eventos'))
  })

  it('saca al visitante de /admin', async () => {
    entrarComo('VISITANTE')
    renderApp('/admin/eventos')
    await waitFor(() => expect(rutaActual()).toBe('/eventos'))
  })

  it('saca al admin de /mis-inscripciones', async () => {
    entrarComo('ADMIN')
    renderApp('/mis-inscripciones')
    await waitFor(() => expect(rutaActual()).toBe('/admin/eventos'))
  })

  it('muestra 404 en una ruta desconocida', async () => {
    entrarComo('VISITANTE')
    renderApp('/no-existe')
    expect(await screen.findByText('Página no encontrada')).toBeInTheDocument()
  })

  it('muestra enlaces según el rol', async () => {
    entrarComo('VISITANTE')
    renderApp('/eventos')
    expect(await screen.findByRole('link', { name: 'Mis inscripciones' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Administración' })).not.toBeInTheDocument()
  })
})

describe('API caída', () => {
  it('explica el problema y permite reintentar', async () => {
    server.use(http.get('*/api/auth/me', () => HttpResponse.error()), )
    renderApp('/eventos')
    expect(await screen.findByText('No se puede conectar con la API')).toBeInTheDocument()
    server.resetHandlers()
    entrarComo('VISITANTE')
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(screen.queryByText('No se puede conectar con la API')).not.toBeInTheDocument())
  })

  it('no aparece con un 401', async () => {
    renderApp('/eventos')
    await waitFor(() => expect(rutaActual()).toBe('/login'))
    expect(screen.queryByText('No se puede conectar con la API')).not.toBeInTheDocument()
  })
})

describe('cerrar sesión', () => {
  it('vuelve a /login', async () => {
    entrarComo('VISITANTE')
    renderApp('/eventos')
    await userEvent.click(await screen.findByRole('button', { name: 'Menú de usuario' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Cerrar sesión' }))
    await waitFor(() => expect(rutaActual()).toBe('/login'))
  })
})
