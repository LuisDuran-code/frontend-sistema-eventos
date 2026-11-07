import { useState } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/mocks/server'
import { entrarComo, usarServidor } from '@/test/app'
import { CampoImagenes } from './CampoImagenes'

usarServidor()

beforeEach(() => entrarComo('ADMIN'))

const ETIQUETA = 'Imágenes del evento'
const foto = (nombre = 'foto.jpg', tipo = 'image/jpeg', bytes = 10) => new File([new Uint8Array(bytes)], nombre, { type: tipo })

function Prueba({ iniciales = [], maximo = 10, onSubiendoChange }: { iniciales?: string[]; maximo?: number; onSubiendoChange?: (v: boolean) => void }) {
  const [imagenes, setImagenes] = useState(iniciales)
  return (
    <>
      <CampoImagenes etiqueta={ETIQUETA} imagenes={imagenes} onChange={setImagenes} maximo={maximo} onSubiendoChange={onSubiendoChange} />
      <output data-testid="valor">{imagenes.join(' ')}</output>
    </>
  )
}

const valor = () => screen.getByTestId('valor').textContent
const subir = (archivos: File | File[], applyAccept = true) =>
  userEvent.setup({ applyAccept }).upload(screen.getByLabelText(ETIQUETA), archivos)

function contarSubidas() {
  const conteo = { valor: 0 }
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'POST' && new URL(request.url).pathname.endsWith('/imagenes')) conteo.valor += 1
  })
  return conteo
}

describe('CampoImagenes', () => {
  it('sube la imagen y muestra su miniatura', async () => {
    render(<Prueba />)
    await subir(foto())
    await waitFor(() => expect(valor()).toMatch(/^https:\/\//))
    expect(screen.getByRole('img', { name: 'Imagen 1' })).toHaveAttribute('src', valor())
  })

  it('sube varias imágenes y las conserva todas', async () => {
    render(<Prueba />)
    await subir([foto('a.jpg'), foto('b.png', 'image/png')])
    await waitFor(() => expect(valor()?.split(' ')).toHaveLength(2))
  })

  it('rechaza un tipo no admitido sin llamar a la API', async () => {
    const subidas = contarSubidas()
    render(<Prueba />)
    await subir(foto('nota.pdf', 'application/pdf'), false)
    expect(await screen.findByRole('alert')).toHaveTextContent('Solo se admiten imágenes JPG, PNG o WebP')
    expect(subidas.valor).toBe(0)
    server.events.removeAllListeners()
  })

  it('rechaza un archivo de más de 4 MB sin llamar a la API', async () => {
    const subidas = contarSubidas()
    render(<Prueba />)
    await subir(foto('grande.jpg', 'image/jpeg', 4 * 1024 * 1024 + 1))
    expect(await screen.findByRole('alert')).toHaveTextContent('La imagen supera los 4 MB')
    expect(subidas.valor).toBe(0)
    server.events.removeAllListeners()
  })

  it('no pasa del máximo y lo dice', async () => {
    render(<Prueba iniciales={['https://a.test/1.jpg']} maximo={2} />)
    await subir([foto('a.jpg'), foto('b.jpg')])
    expect(await screen.findByRole('alert')).toHaveTextContent('Puedes tener hasta 2 imágenes')
    await waitFor(() => expect(valor()?.split(' ')).toHaveLength(2))
  })

  it('llegado al máximo deshabilita el botón y dice por qué', () => {
    render(<Prueba iniciales={['https://a.test/1.jpg']} maximo={1} />)
    expect(screen.getByRole('button', { name: 'Agregar imágenes' })).toBeDisabled()
    expect(screen.getByText('Llegaste al máximo de 1 imagen')).toBeInTheDocument()
  })

  it('muestra el error de la subida y conserva lo anterior', async () => {
    server.use(http.post('*/api/imagenes', () => HttpResponse.json({ message: 'detalle interno' }, { status: 500 })))
    render(<Prueba iniciales={['https://a.test/1.jpg']} />)
    await subir(foto())
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo subir la imagen')
    expect(valor()).toBe('https://a.test/1.jpg')
  })

  it('avisa mientras sube', async () => {
    server.use(
      http.post('*/api/imagenes', async () => {
        await delay(30)
        return HttpResponse.json({ url: 'https://res.cloudinary.com/x/a.jpg' }, { status: 201 })
      }),
    )
    const onSubiendoChange = vi.fn()
    render(<Prueba onSubiendoChange={onSubiendoChange} />)
    await subir(foto())
    expect(await screen.findByRole('button', { name: 'Subiendo…' })).toBeDisabled()
    await waitFor(() => expect(onSubiendoChange).toHaveBeenLastCalledWith(false))
    expect(onSubiendoChange).toHaveBeenCalledWith(true)
  })

  it('quita una imagen', async () => {
    render(<Prueba iniciales={['https://a.test/1.jpg', 'https://a.test/2.jpg']} />)
    await userEvent.click(screen.getByRole('button', { name: 'Quitar imagen 1' }))
    expect(valor()).toBe('https://a.test/2.jpg')
  })

  it('marca la primera como principal y permite cambiarla', async () => {
    render(<Prueba iniciales={['https://a.test/1.jpg', 'https://a.test/2.jpg']} />)
    const lista = within(screen.getByRole('list'))
    expect(lista.getAllByRole('listitem')[0]).toHaveTextContent('Principal')
    await userEvent.click(screen.getByRole('button', { name: 'Usar imagen 2 como principal' }))
    expect(valor()).toBe('https://a.test/2.jpg https://a.test/1.jpg')
  })
})
