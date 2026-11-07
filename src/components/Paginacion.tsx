import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaginacionProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Paginacion({ page, totalPages, onChange }: PaginacionProps) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Paginación" className="tabular mt-6 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
        Anterior
      </Button>
      <span className="text-sm">
        Página {page + 1} de {totalPages}
      </span>
      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Siguiente
        <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
      </Button>
    </nav>
  )
}
