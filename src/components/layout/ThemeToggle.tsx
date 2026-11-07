import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const oscuro = resolvedTheme === 'dark'
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      aria-label={oscuro ? 'Usar modo claro' : 'Usar modo oscuro'}
      onClick={() => setTheme(oscuro ? 'light' : 'dark')}
    >
      {oscuro ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
