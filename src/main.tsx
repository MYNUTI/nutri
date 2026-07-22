import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { normalizeLegacyLocation } from './app/normalizeLegacyLocation'
import { PageViewTracker } from './app/PageViewTracker'

normalizeLegacyLocation()

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <FavoritesProvider>
        <BrowserRouter>
          <PageViewTracker />
          <App />
        </BrowserRouter>
      </FavoritesProvider>
    </QueryClientProvider>
  </StrictMode>,
)
