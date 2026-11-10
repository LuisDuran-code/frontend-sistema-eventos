import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { obtenerDb } from '@/mocks/db'
import { entrarComo, renderApp, usarServidor } from '@/test/app'

usarServidor()

const FORO = 2
const PROPIA_1 = 'https://res.cloudinary.com/demo/uno.jpg'
const PROPIA_2 = 'https://res.cloudinary.com/demo/dos.jpg'
const foto = () => new File([new Uint8Array(10)], 'foto.jpg', { type: 'image/jpeg' })
const evento = (id: number) => obtenerDb().eventos.find((e) => e.id === id)!

describe('imágenes en la cartelera', () => {
  it('la tarjeta usa la primera imagen del evento', async () => {
    evento(FORO).imagenes = [PROPIA_1, PROPIA_2]
    entrarComo('VISITANTE')
    const { container } = renderApp('/eventos')
    await screen.findByRole('heading', { name: evento(FORO).nombre })
    await waitFor(() => expect(container.querySelector(`img[src="${PROPIA_1}"]`)).not.toBeNull())
    expect(container.querySelector(`img[src="${PROPIA_2}"]`)).toBeNull()
  })

  it('sin imágenes propias usa la de la ubicación', async () => {
    const e = evento(FORO)
    const ubicacion = obtenerDb().ubicaciones.find((u) => u.id === e.ubicacionId)!
    entrarComo('VISITANTE')
    const { container } = renderApp('/eventos')
    await waitFor(() => expect(container.querySelector(`img[src="${ubicacion.imagenPrincipal}"]`)).not.toBeNull())
  })
})

describe('con una API sin el campo imagenes', () => {
  it('la cartelera y el detalle siguen funcionando', async () => {
    obtenerDb().eventos.forEach((e) => {
      delete (e as Partial<typeof e>).imagenes
    })
    entrarComo('VISITANTE')
    const { unmount } = renderApp('/eventos')
    expect(await screen.findByRole('heading', { name: evento(FORO).nombre })).toBeInTheDocument()
    unmount()
    renderApp(`/eventos/${FORO}`)
    expect(await screen.findByRole('button', { name: 'Inscribirme' })).toBeInTheDocument()
  })
})

describe('galería del detalle', () => {
  it('muestra la primera y cambia al elegir otra', async () => {
    evento(FORO).imagenes = [PROPIA_1, PROPIA_2]
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    const nombre = `Imagen de ${evento(FORO).nombre}`
    expect(await screen.findByRole('img', { name: nombre })).toHaveAttribute('src', PROPIA_1)
    await userEvent.click(screen.getByRole('button', { name: 'Ver imagen 2' }))
    expect(screen.getByRole('img', { name: nombre })).toHaveAttribute('src', PROPIA_2)
    expect(screen.getByRole('button', { name: 'Ver imagen 2' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('con una sola imagen no muestra miniaturas', async () => {
    evento(FORO).imagenes = [PROPIA_1]
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    await screen.findByRole('img', { name: `Imagen de ${evento(FORO).nombre}` })
    expect(screen.queryByRole('button', { name: /Ver imagen/ })).not.toBeInTheDocument()
  })

  it('sin imágenes propias usa la de la ubicación', async () => {
    const e = evento(FORO)
    const ubicacion = obtenerDb().ubicaciones.find((u) => u.id === e.ubicacionId)!
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    expect(await screen.findByRole('img', { name: `Imagen de ${e.nombre}` })).toHaveAttribute('src', ubicacion.imagenPrincipal)
  })
})

describe('el administrador agrega imágenes', () => {
  async function abrirEdicion() {
    entrarComo('ADMIN')
    renderApp('/admin/eventos')
    const nombre = evento(FORO).nombre
    const fila = (await screen.findAllByText(nombre))[0].closest('tr')!
    await userEvent.click(within(fila).getByRole('button', { name: new RegExp(nombre) }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Editar' }))
    return screen.findByRole('dialog')
  }

  it('sube una imagen y la guarda en el evento', async () => {
    await abrirEdicion()
    await userEvent.upload(screen.getByLabelText('Imágenes del evento'), foto())
    await screen.findByRole('img', { name: 'Imagen 1' })
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(evento(FORO).imagenes).toHaveLength(1))
    expect(evento(FORO).imagenes[0]).toMatch(/^https:\/\//)
  })

  it('conserva las imágenes que ya tenía', async () => {
    evento(FORO).imagenes = [PROPIA_1]
    await abrirEdicion()
    expect(screen.getByRole('img', { name: 'Imagen 1' })).toHaveAttribute('src', PROPIA_1)
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(evento(FORO).imagenes).toEqual([PROPIA_1])
  })
})

describe('el visitante', () => {
  it('no ve controles para subir imágenes', async () => {
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    await screen.findByRole('button', { name: 'Inscribirme' })
    expect(screen.queryByRole('button', { name: 'Agregar imágenes' })).not.toBeInTheDocument()
  })
})

describe('galería del lugar', () => {
  const ubicacionDe = (id: number) => obtenerDb().ubicaciones.find((u) => u.id === evento(id).ubicacionId)!

  it('muestra las imágenes de la ubicación', async () => {
    const u = ubicacionDe(FORO)
    u.imagenPrincipal = PROPIA_1
    u.imagenes = [PROPIA_2]
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    const seccion = (await screen.findByRole('heading', { name: 'Galería del lugar' })).closest('section')!
    expect(within(seccion).getByRole('img', { name: `Foto 1 de ${u.nombre}` })).toHaveAttribute('src', PROPIA_1)
    expect(within(seccion).getByRole('img', { name: `Foto 2 de ${u.nombre}` })).toHaveAttribute('src', PROPIA_2)
  })

  it('sin imágenes de la ubicación no muestra nada', async () => {
    const u = ubicacionDe(FORO)
    u.imagenPrincipal = null
    u.imagenes = []
    entrarComo('VISITANTE')
    renderApp(`/eventos/${FORO}`)
    await screen.findByRole('button', { name: 'Inscribirme' })
    expect(screen.queryByRole('heading', { name: 'Galería del lugar' })).not.toBeInTheDocument()
  })
})
