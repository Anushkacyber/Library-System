import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: '"DM Sans", sans-serif',
                borderRadius: '14px',
                fontSize: '13px',
                fontWeight: '500',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid rgba(0,0,0,0.06)',
              },
              success: {
                iconTheme: { primary: '#6366f1', secondary: '#fff' },
                style: { background: '#fff', color: '#1e293b' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
                style: { background: '#fff', color: '#1e293b' },
              },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
