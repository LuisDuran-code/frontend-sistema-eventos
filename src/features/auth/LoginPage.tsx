import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { mensajeError } from '@/lib/api'
import { loginSchema, type LoginValues } from '@/lib/esquemas'
import { rutaInicial } from '@/lib/reglas'
import { useAuth } from './AuthContext'
import { PantallaAcceso } from './PantallaAcceso'

export function LoginPage() {
  const { sesion, iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  if (sesion) return <Navigate to={rutaInicial(sesion.rol)} replace />

  async function enviar(valores: LoginValues) {
    try {
      const nueva = await iniciarSesion(valores.email, valores.password)
      navigate(rutaInicial(nueva.rol), { replace: true })
    } catch (error) {
      form.setError('root', { message: mensajeError(error, { 0: 'No se puede conectar con la API', 401: 'Credenciales inválidas' }, 'No se pudo iniciar sesión') })
    }
  }

  const errorGeneral = form.formState.errors.root?.message

  return (
    <PantallaAcceso titulo="Iniciar sesión">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(enviar)} noValidate className="space-y-4">
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
                  <Input type="password" autoComplete="current-password" {...field} />
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
            Iniciar sesión
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-medium text-primary underline underline-offset-4">
              Crear cuenta
            </Link>
          </p>
        </form>
      </Form>
    </PantallaAcceso>
  )
}
