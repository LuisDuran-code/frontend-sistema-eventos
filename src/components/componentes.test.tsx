import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import { BotonConMotivo } from './BotonConMotivo'
import { ConfirmDialog } from './ConfirmDialog'
import { CuposBadge } from './CuposBadge'
import { EstadoError } from './EstadoError'
import { ImagenConPlaceholder } from './ImagenConPlaceholder'
import { Paginacion } from './Paginacion'
import { Sello } from './Sello'

describe('CuposBadge', () => {
  it('muestra Lleno sin cupos', () => {
    render(<CuposBadge disponibles={0} />)
    expect(screen.getByText('Lleno')).toBeInTheDocument()
  })

  it('muestra los cupos disponibles', () => {
    render(<CuposBadge disponibles={8} />)
    expect(screen.getByText('8 cupos')).toBeInTheDocument()
  })

  it('usa singular con un cupo', () => {
    render(<CuposBadge disponibles={1} />)
    expect(screen.getByText('1 cupo')).toBeInTheDocument()
  })
})

describe('Sello', () => {
  it('muestra el estado', () => {
    render(<Sello estado="Inscrito" />)
    expect(screen.getByText('Inscrito')).toBeInTheDocument()
  })
})

describe('ImagenConPlaceholder', () => {
  it('cambia al placeholder si la imagen falla', () => {
    render(<ImagenConPlaceholder src="https://a.b/c.jpg" alt="Sala" />)
    fireEvent.error(screen.getByRole('img', { name: 'Sala' }))
    expect(screen.getByTestId('imagen-placeholder')).toBeInTheDocument()
  })

  it('muestra el placeholder sin src', () => {
    render(<ImagenConPlaceholder src={null} alt="Sala" />)
    expect(screen.getByTestId('imagen-placeholder')).toBeInTheDocument()
  })
})

describe('ConfirmDialog', () => {
  it('deshabilita la acción mientras está pendiente', () => {
    render(<ConfirmDialog open onOpenChange={() => undefined} titulo="¿Seguro?" descripcion="Texto" accion="Confirmar" onConfirm={() => undefined} pendiente />)
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })

  it('no se cierra solo al confirmar', async () => {
    const onOpenChange = vi.fn()
    const onConfirm = vi.fn()
    render(<ConfirmDialog open onOpenChange={onOpenChange} titulo="¿Seguro?" descripcion="Texto" accion="Confirmar" onConfirm={onConfirm} />)
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

describe('BotonConMotivo', () => {
  it('se deshabilita y muestra el motivo visible', () => {
    render(<BotonConMotivo motivo="El evento está lleno">Inscribirme</BotonConMotivo>)
    expect(screen.getByRole('button', { name: 'Inscribirme' })).toBeDisabled()
    expect(screen.getByText('El evento está lleno')).toBeVisible()
  })

  it('funciona sin motivo', () => {
    render(<BotonConMotivo motivo={null}>Inscribirme</BotonConMotivo>)
    expect(screen.getByRole('button', { name: 'Inscribirme' })).toBeEnabled()
  })
})

describe('Paginacion', () => {
  it('no se muestra con una página', () => {
    const { container } = render(<Paginacion page={0} totalPages={1} onChange={() => undefined} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('avanza a la siguiente página', async () => {
    const onChange = vi.fn()
    render(<Paginacion page={0} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('deshabilita Anterior en la primera página', () => {
    render(<Paginacion page={0} totalPages={3} onChange={() => undefined} />)
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
  })
})

describe('EstadoError', () => {
  it('reintenta al pulsar el botón', async () => {
    const onRetry = vi.fn()
    render(<EstadoError error={new ApiError(500, '')} onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
