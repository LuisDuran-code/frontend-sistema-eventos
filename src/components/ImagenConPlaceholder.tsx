import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImagenProps {
  src: string | null | undefined
  alt: string
  className?: string
}

export function ImagenConPlaceholder({ src, alt, className }: ImagenProps) {
  const [fallo, setFallo] = useState(false)

  useEffect(() => setFallo(false), [src])

  if (!src || fallo) {
    return (
      <div data-testid="imagen-placeholder" className={cn('flex items-center justify-center bg-secondary text-primary', className)}>
        <ImageOff className="h-8 w-8" aria-hidden />
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFallo(true)} className={cn('object-cover', className)} />
}
