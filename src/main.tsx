import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async' // <--- Importe isso
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Envolva o App com o Provider */}
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)