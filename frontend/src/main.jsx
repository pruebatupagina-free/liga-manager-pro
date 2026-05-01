import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename="/liga-manager-pro">
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--color-secondary)',
                color: 'var(--color-fg)',
                border: '1px solid var(--color-border)',
                fontFamily: 'DM Sans, sans-serif',
              },
              success: { iconTheme: { primary: 'var(--color-accent)', secondary: 'var(--color-fg)' } },
              error: { iconTheme: { primary: 'var(--color-destructive)', secondary: 'var(--color-fg)' } },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
