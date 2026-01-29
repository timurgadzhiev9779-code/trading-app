import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { TradingProvider } from './context/TradingContext'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <TradingProvider>
        <App />
      </TradingProvider>
    </BrowserRouter>
  </React.StrictMode>,
)