import { useState, type ReactNode } from 'react'
import { ImagenConPlaceholder } from '@/components/ImagenConPlaceholder'
import { cn } from '@/lib/utils'

interface GaleriaEventoProps {
  imagenes: string[]
  alt: string
  children?: ReactNode
}

export function GaleriaEvento({ imagenes, alt, children }: GaleriaEventoProps) {
  const [elegida, setElegida] = useState(0)
  const indice = elegida < imagenes.length ? elegida : 0

  return (
    <div className="space-y-3">
      <div className="relative">
        <ImagenConPlaceholder src={imagenes[indice]} alt={alt} className="aspect-[16/10] w-full rounded-xl" />
        {children}
      </div>
      {imagenes.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {imagenes.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              aria-label={`Ver imagen ${i + 1}`}
              aria-pressed={i === indice}
              onClick={() => setElegida(i)}
              className={cn(
                'overflow-hidden rounded-md border-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                i === indice ? 'border-primary' : 'border-transparent hover:border-border',
              )}
            >
              <ImagenConPlaceholder src={url} alt="" className="aspect-[16/10] w-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
