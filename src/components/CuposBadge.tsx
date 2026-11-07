import { Badge } from '@/components/ui/badge'

export function CuposBadge({ disponibles }: { disponibles: number }) {
  if (disponibles <= 0) {
    return <Badge className="border-transparent bg-destructive text-destructive-foreground hover:bg-destructive">Lleno</Badge>
  }
  return (
    <Badge className="tabular border-transparent bg-success text-success-foreground hover:bg-success">
      {disponibles} {disponibles === 1 ? 'cupo' : 'cupos'}
    </Badge>
  )
}
