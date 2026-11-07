import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/features/auth/AuthContext'
import { ApiError } from '@/lib/api'
import { AppRoutes } from '@/routes'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: (fallos, error) => fallos < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
})

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
