import '@kieranklaassen/live-mix/react/styles.css'
import './playground.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

const root = document.getElementById('root')
if (!root) throw new Error('playground: #root missing')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
