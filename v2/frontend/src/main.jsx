import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import ChatWidget from './components/ChatWidget'
import RootErrorBoundary from './components/RootErrorBoundary'
import './styles/index.css'

// Global error handlers for errors before React loads
window.onerror = () => false
window.onunhandledrejection = () => false

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <BrowserRouter>
        <App />
        <ChatWidget />
      </BrowserRouter>
    </RootErrorBoundary>
  </React.StrictMode>
)
