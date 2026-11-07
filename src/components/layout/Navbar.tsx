import { useState } from 'react'
import { Menu, UserRound } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/AuthContext'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './ThemeToggle'

const ETIQUETA_ROL = { ADMIN: 'Administración', VISITANTE: 'Visitante' }

function Enlaces({ alNavegar, claseBase }: { alNavegar?: () => void; claseBase: string }) {
  const { sesion } = useAuth()
  const enlaces =
    sesion?.rol === 'ADMIN'
      ? [
          { a: '/eventos', texto: 'Eventos' },
          { a: '/admin/eventos', texto: 'Administración' },
        ]
      : [
          { a: '/eventos', texto: 'Eventos' },
          { a: '/mis-inscripciones', texto: 'Mis inscripciones' },
        ]
  return (
    <>
      {enlaces.map((e) => (
        <NavLink key={e.a} to={e.a} end={e.a === '/eventos'} onClick={alNavegar} className={({ isActive }) => cn(claseBase, isActive && 'underline underline-offset-8')}>
          {e.texto}
        </NavLink>
      ))}
    </>
  )
}

export function Navbar() {
  const { sesion, cerrarSesion } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const claseIcono = 'text-shell-foreground hover:bg-white/15 hover:text-shell-foreground'

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-6 bg-shell px-4 text-shell-foreground sm:px-6 lg:px-12">
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className={cn('md:hidden', claseIcono)} aria-label="Abrir navegación">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <SheetTitle>Aforo</SheetTitle>
          <nav className="mt-4 flex flex-col gap-3 font-semibold">
            <Enlaces claseBase="py-1" alNavegar={() => setAbierto(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      <Link to="/" className="text-3xl font-extrabold tracking-tight">
        Aforo
      </Link>

      <nav className="ml-4 hidden items-center gap-8 font-semibold md:flex">
        <Enlaces claseBase="hover:underline hover:underline-offset-8" />
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle className={claseIcono} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className={claseIcono} aria-label="Menú de usuario">
              <UserRound className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <span className="block truncate">{sesion?.nombre ?? sesion?.email}</span>
              <span className="block text-xs font-normal text-muted-foreground">{sesion && ETIQUETA_ROL[sesion.rol]}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => cerrarSesion()}>Cerrar sesión</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
