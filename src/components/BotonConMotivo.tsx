import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'

interface BotonConMotivoProps extends ComponentProps<typeof Button> {
  motivo: string | null
}

export function BotonConMotivo({ motivo, disabled, ...props }: BotonConMotivoProps) {
  return (
    <div className="flex flex-col gap-2">
      <Button disabled={disabled || motivo !== null} {...props} />
      {motivo && <p className="text-sm text-muted-foreground">{motivo}</p>}
    </div>
  )
}
