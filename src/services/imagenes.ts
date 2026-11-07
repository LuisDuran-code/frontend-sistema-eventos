import { api } from '@/lib/api'

export async function subirImagen(archivo: File): Promise<string> {
  const cuerpo = new FormData()
  cuerpo.append('archivo', archivo)
  const { url } = await api.post<{ url: string }>('/imagenes', cuerpo)
  return url
}
