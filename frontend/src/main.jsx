import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './styles/global.css'
import { DataProvider } from './Sculpt/DataContext.jsx'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/Schedule-Sculptor/">
      <DataProvider>
        <App />
      </DataProvider>
    </BrowserRouter>
  </StrictMode>,
)
