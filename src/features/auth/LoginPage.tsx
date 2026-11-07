import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { mensajeError } from '@/lib/api'
import { loginSchema, type LoginValues } from '@/lib/esquemas'
import { rutaInicial } from '@/lib/reglas'
import { useAuth } from './AuthContext'

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-shell px-4 py-10">
      <p className="text-4xl font-extrabold tracking-tight text-shell-foreground">Aforo</p>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
        </CardHeader>
        <CardContent>
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
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
