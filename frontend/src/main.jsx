import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Global Fetch Patch: Ensure credentials are sent with every request
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  if (args[1]) {
    args[1].credentials = args[1].credentials || 'include';
  } else {
    args[1] = { credentials: 'include' };
  }
  return originalFetch(...args);
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
