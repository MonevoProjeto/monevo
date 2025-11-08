import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 1. Importe o AppProvider aqui
import { AppProvider } from './contexts/AppContext.tsx';

// 2. Encontre o 'root'
const container = document.getElementById("root")!;
const root = createRoot(container);

// 3. Envolva o <App /> com o Provider
root.render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);