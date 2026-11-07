import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-12 lg:py-9">
        <Outlet />
      </main>
    </div>
  )
}
