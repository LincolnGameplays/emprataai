import React from 'react'
import ReactDOM from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { PulseProvider } from './contexts/PulseContext'
import App from './App'
import NetworkStatus from './components/NetworkStatus'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <PulseProvider>
        <NetworkStatus />
        <App />
      </PulseProvider>
    </HelmetProvider>
  </React.StrictMode>,
)

