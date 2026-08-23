import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/hahmlet/500.css'
import '@fontsource/hahmlet/600.css'
import '@fontsource/ibm-plex-sans-kr/400.css'
import '@fontsource/ibm-plex-sans-kr/500.css'
import '@fontsource/ibm-plex-sans-kr/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './styles/tokens.css'
import './styles/app.css'
import App from './App'

const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new TypeError('The app root element is missing')
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
