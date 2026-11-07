import { useId, useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, Star, X } from 'lucide-react'
import { ImagenConPlaceholder } from '@/components/ImagenConPlaceholder'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { mensajeError } from '@/lib/api'
import { subirImagen } from '@/services/imagenes'

const TIPOS = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 4 * 1024 * 1024
const ERROR_TIPO = 'Solo se admiten imágenes JPG, PNG o WebP'
const ERROR_TAMANO = 'La imagen supera los 4 MB'

interface CampoImagenesProps {
  etiqueta: string
  imagenes: string[]
  onChange: (imagenes: string[]) => void
  maximo: number
  onSubiendoChange?: (subiendo: boolean) => void
}

function motivoDeRechazo(archivo: File): string | null {
  if (!TIPOS.includes(archivo.type)) return ERROR_TIPO
  if (archivo.size > MAX_BYTES) return ERROR_TAMANO
  return null
}

export function CampoImagenes({ etiqueta, imagenes, onChange, maximo, onSubiendoChange }: CampoImagenesProps) {
  const id = useId()
  const entrada = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lleno = imagenes.length >= maximo

  function marcarSubida(valor: boolean) {
    setSubiendo(valor)
    onSubiendoChange?.(valor)
  }

  async function elegir(evento: ChangeEvent<HTMLInputElement>) {
    const elegidos = Array.from(evento.target.files ?? [])
    evento.target.value = ''

    const validos = elegidos.filter((archivo) => motivoDeRechazo(archivo) === null)
    const rechazado = elegidos.find((archivo) => motivoDeRechazo(archivo) !== null)
    const disponibles = maximo - imagenes.length
    const aSubir = validos.slice(0, disponibles)
    setError(rechazado ? motivoDeRechazo(rechazado) : validos.length > disponibles ? `Puedes tener hasta ${maximo} imágenes` : null)
    if (aSubir.length === 0) return

    marcarSubida(true)
    let lista = imagenes
    for (const archivo of aSubir) {
      try {
        lista = [...lista, await subirImagen(archivo)]
        onChange(lista)
      } catch (causa) {
        setError(mensajeError(causa, { 0: 'No se puede conectar con la API', 413: ERROR_TAMANO, 415: ERROR_TIPO }, 'No se pudo subir la imagen'))
      }
    }
    marcarSubida(false)
  }

  function usarComoPrincipal(indice: number) {
    onChange([imagenes[indice], ...imagenes.filter((_, i) => i !== indice)])
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      {imagenes.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {imagenes.map((url, i) => (
            <li key={`${url}-${i}`} className="relative">
              <ImagenConPlaceholder src={url} alt={`Imagen ${i + 1}`} className="aspect-[16/10] w-full rounded-md" />
              {i === 0 && <span className="absolute left-1 top-1 rounded-sm bg-card px-1.5 py-0.5 text-xs font-semibold text-card-foreground">Principal</span>}
              <div className="absolute right-1 top-1 flex gap-1">
                {i > 0 && (
                  <Button type="button" size="icon" variant="secondary" className="h-8 w-8" disabled={subiendo} aria-label={`Usar imagen ${i + 1} como principal`} onClick={() => usarComoPrincipal(i)}>
                    <Star className="h-4 w-4" aria-hidden />
                  </Button>
                )}
                <Button type="button" size="icon" variant="secondary" className="h-8 w-8" disabled={subiendo} aria-label={`Quitar imagen ${i + 1}`} onClick={() => onChange(imagenes.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <input ref={entrada} id={id} type="file" accept={TIPOS.join(',')} multiple disabled={subiendo || lleno} className="hidden" onChange={elegir} />
      <Button type="button" variant="outline" disabled={subiendo || lleno} onClick={() => entrada.current?.click()}>
        <ImagePlus className="h-4 w-4" aria-hidden />
        {subiendo ? 'Subiendo…' : 'Agregar imágenes'}
      </Button>
      <p className="text-sm text-muted-foreground">
        {lleno ? `Llegaste al máximo de ${maximo} ${maximo === 1 ? 'imagen' : 'imágenes'}` : 'JPG, PNG o WebP, hasta 4 MB cada una.'}
      </p>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
