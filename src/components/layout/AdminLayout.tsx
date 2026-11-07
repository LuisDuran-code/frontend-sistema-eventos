import { useState } from 'react'
import { CalendarDays, MapPin, PanelLeft } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const SECCIONES = [
  { a: '/admin/eventos', texto: 'Eventos', icono: CalendarDays },
  { a: '/admin/ubicaciones', texto: 'Ubicaciones', icono: MapPin },
]

function Secciones({ alNavegar }: { alNavegar?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 font-semibold" aria-label="Administración">
      {SECCIONES.map(({ a, texto, icono: Icono }) => (
        <NavLink
          key={a}
          to={a}
          onClick={alNavegar}
          className={({ isActive }) =>
            cn('flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-secondary', isActive && 'bg-primary text-primary-foreground hover:bg-primary')
          }
        >
          <Icono className="h-4 w-4" aria-hidden />
          {texto}
        </NavLink>
      ))}
    </nav>
  )
}

export function AdminLayout() {
  const [abierto, setAbierto] = useState(false)
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-10">
      <aside className="hidden w-52 shrink-0 lg:block">
        <div className="sticky top-[108px]">
          <Secciones />
        </div>
      </aside>
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="self-start lg:hidden">
            <PanelLeft className="mr-2 h-4 w-4" aria-hidden />
            Secciones
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetTitle className="mb-4">Administración</SheetTitle>
          <Secciones alNavegar={() => setAbierto(false)} />
        </SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
