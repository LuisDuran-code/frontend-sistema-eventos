import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

async function montar() {
  let panel = null
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
    const { PanelSimular } = await import('./mocks/PanelSimular')
    panel = <PanelSimular />
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      {panel}
    </StrictMode>,
  )
}

montar()
