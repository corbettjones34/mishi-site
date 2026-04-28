import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MishiHomepage from './MishiHomepage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MishiHomepage />
  </StrictMode>,
)
