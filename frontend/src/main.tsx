import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { migrarSiHaceFalta } from './services/migration'

// Migración inicial localStorage → Supabase (solo se ejecuta una vez por dispositivo)
migrarSiHaceFalta().catch(err => console.error('Migración inicial falló:', err))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
