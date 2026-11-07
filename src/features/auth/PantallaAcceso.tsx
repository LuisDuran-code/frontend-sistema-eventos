import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function PantallaAcceso({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-shell px-4 py-10">
      <p className="text-4xl font-extrabold tracking-tight text-shell-foreground">Aforo</p>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-2xl font-bold">{titulo}</h1>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  )
}
