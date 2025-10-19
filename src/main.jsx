import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { DashboardProvider } from './context/DashboardContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { supabase } from './lib/supabaseClient.js';
import './index.css';

// Expose supabase to window for development and testing
if (typeof window !== 'undefined') {
  window.supabase = supabase;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <DashboardProvider>
          <App />
        </DashboardProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
