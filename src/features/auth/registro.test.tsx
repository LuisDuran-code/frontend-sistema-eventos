import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { obtenerDb } from '@/mocks/db'
import { server } from '@/mocks/server'
import { entrarComo, renderApp, rutaActual, usarServidor } from '@/test/app'

usarServidor()

async function llenar(nombre: string, correo: string, clave: string) {
  if (nombre) await userEvent.type(await screen.findByLabelText('Nombre'), nombre)
  if (correo) await userEvent.type(await screen.findByLabelText('Correo'), correo)
  if (clave) await userEvent.type(await screen.findByLabelText('Contraseña'), clave)
  await userEvent.click(await screen.findByRole('button', { name: 'Crear cuenta' }))
}

describe('registro', () => {
  it('se llega desde el inicio de sesión', async () => {
    renderApp('/login')
    await userEvent.click(await screen.findByRole('link', { name: 'Crear cuenta' }))
    expect(rutaActual()).toBe('/registro')
  })

  it('vuelve al inicio de sesión', async () => {
    renderApp('/registro')
    await userEvent.click(await screen.findByRole('link', { name: 'Iniciar sesión' }))
    expect(rutaActual()).toBe('/login')
  })

  it('valida los campos antes de enviar', async () => {
    renderApp('/registro')
    await llenar('', '', '')
    expect(await screen.findByText('Escribe tu nombre')).toBeInTheDocument()
    expect(screen.getByText('Escribe un correo válido')).toBeInTheDocument()
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
    expect(obtenerDb().usuarios.find((u) => u.email === '')).toBeUndefined()
  })

  it('rechaza una contraseña que BCrypt no admite', async () => {
    renderApp('/registro')
    await userEvent.click(await screen.findByLabelText('Contraseña'))
    await userEvent.paste('x'.repeat(73))
    await llenar('Ana', 'ana@nueva.test', '')
    expect(await screen.findByText('Máximo 72 caracteres')).toBeInTheDocument()
  })

  it('crea la cuenta como visitante y entra a la cartelera', async () => {
    renderApp('/registro')
    await llenar('  Ana Nueva  ', 'ana@nueva.test', 'una-clave-larga')
    await waitFor(() => expect(rutaActual()).toBe('/eventos'))
    expect(obtenerDb().usuarios.find((u) => u.email === 'ana@nueva.test')).toMatchObject({ nombre: 'Ana Nueva', rol: 'VISITANTE' })
    expect(await screen.findByRole('link', { name: 'Mis inscripciones' })).toBeInTheDocument()
  })

  it('muestra el correo repetido en el formulario', async () => {
    renderApp('/registro')
    await llenar('Otra persona', 'admin@aforo.test', 'una-clave-larga')
    expect(await screen.findByRole('alert')).toHaveTextContent('El email ya está registrado')
    expect(rutaActual()).toBe('/registro')
  })

  it('usa un texto propio si el 409 llega sin mensaje', async () => {
    server.use(http.post('*/api/auth/registro', () => HttpResponse.json({}, { status: 409 })))
    renderApp('/registro')
    await llenar('Otra persona', 'otra@nueva.test', 'una-clave-larga')
    expect(await screen.findByRole('alert')).toHaveTextContent('Ese correo ya tiene una cuenta')
  })

  it('si la cuenta se crea pero no entra, manda a iniciar sesión y lo dice', async () => {
    server.use(http.post('*/api/auth/login', () => HttpResponse.json({}, { status: 500 })))
    renderApp('/registro')
    await llenar('Ana', 'ana@nueva.test', 'una-clave-larga')
    await waitFor(() => expect(rutaActual()).toBe('/login'))
    expect(await screen.findByText('Tu cuenta está lista. Inicia sesión para continuar.')).toBeInTheDocument()
  })

  it('con sesión abierta no muestra el formulario', async () => {
    entrarComo('VISITANTE')
    renderApp('/registro')
    await waitFor(() => expect(rutaActual()).toBe('/eventos'))
  })
})
