import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Self-hosted display face for headlines, the nameplate and the canvas backdrop (latin subset only)
import '@fontsource/playfair-display/latin-700.css'
import '@fontsource/playfair-display/latin-800.css'
import '@fontsource/playfair-display/latin-900.css'
// Flightline skin (/flightline): Barlow Condensed display, B612 body, B612 Mono readouts. Files load only when used.
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/latin-800.css'
import '@fontsource/b612/latin-400.css'
import '@fontsource/b612/latin-400-italic.css'
import '@fontsource/b612/latin-700.css'
import '@fontsource/b612-mono/latin-400.css'
import '@fontsource/b612-mono/latin-700.css'
import './styles/App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
