import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted display face for headlines, the nameplate and the canvas backdrop (latin subset only)
import '@fontsource/playfair-display/latin-700.css'
import '@fontsource/playfair-display/latin-800.css'
import '@fontsource/playfair-display/latin-900.css'
import './styles/App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
