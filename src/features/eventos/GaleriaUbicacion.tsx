import { ImagenConPlaceholder } from '@/components/ImagenConPlaceholder'

interface GaleriaUbicacionProps {
  imagenes: string[]
  nombre: string
}

export function GaleriaUbicacion({ imagenes, nombre }: GaleriaUbicacionProps) {
  if (imagenes.length === 0) return null

  return (
    <section aria-labelledby="galeria-del-lugar" className="mt-12 space-y-4">
      <h2 id="galeria-del-lugar" className="text-2xl font-bold tracking-tight">
        Galería del lugar
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {imagenes.map((url, i) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="overflow-hidden rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <ImagenConPlaceholder
              src={url}
              alt={`Foto ${i + 1} de ${nombre}`}
              className="aspect-[16/10] w-full transition-transform duration-300 hover:scale-105 motion-reduce:transition-none"
            />
          </a>
        ))}
      </div>
    </section>
  )
}
