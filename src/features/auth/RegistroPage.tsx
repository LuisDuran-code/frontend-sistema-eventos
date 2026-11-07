import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { mensajeError } from '@/lib/api'
import { registroSchema, type RegistroValues } from '@/lib/esquemas'
import { rutaInicial } from '@/lib/reglas'
import { registro } from '@/services/auth'
import { useAuth } from './AuthContext'
import { PantallaAcceso } from './PantallaAcceso'

export function RegistroPage() {
  const { sesion, iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const form = useForm<RegistroValues>({
    resolver: zodResolver(registroSchema),
    defaultValues: { nombre: '', email: '', password: '' },
  })

  if (sesion) return <Navigate to={rutaInicial(sesion.rol)} replace />

  async function enviar(valores: RegistroValues) {
    try {
      await registro(valores.nombre, valores.email, valores.password)
    } catch (error) {
      form.setError('root', {
        message: mensajeError(error, { 0: 'No se puede conectar con la API', 409: 'Ese correo ya tiene una cuenta' }, 'No se pudo crear la cuenta'),
      })
      return
    }

    try {
      const nueva = await iniciarSesion(valores.email, valores.password)
      navigate(rutaInicial(nueva.rol), { replace: true })
    } catch {
      toast.success('Tu cuenta está lista. Inicia sesión para continuar.')
      navigate('/login', { replace: true })
    }
  }

  const errorGeneral = form.formState.errors.root?.message

  return (
    <PantallaAcceso titulo="Crear cuenta">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(enviar)} noValidate className="space-y-4">
          <FormField
            control={form.control}
            name="nombre"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {errorGeneral && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errorGeneral}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Crear cuenta
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-medium text-primary underline underline-offset-4">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </Form>
    </PantallaAcceso>
  )
}
