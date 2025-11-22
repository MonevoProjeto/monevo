/**
 * ponto de entrada do frontend
 * primeiro arquivo que o react executa quando o app abre no navegador
 */

import React from 'react';
import { createRoot } from 'react-dom/client'; //função que liga react com html
import App from './App.tsx'; //importa o componente raiz do app
import './index.css'; //estilo global 

// 1. Importe o AppProvider aqui
// o appcontext é trazido pro escopo principal, para envolver todo o app com aquele "cerebro local" que armazena metas, transações, usuário, etc
// sem ele as paginas nao conseguem usar useApp()
import { AppProvider } from './contexts/AppContext.tsx';

// IMPORTA O BROWSER ROUTER
import { BrowserRouter } from "react-router-dom";

// 2. Encontre o 'root'
//conecta o react com o html (index.html)
//no index.html existe uma div com id "root", que é onde o react vai injetar o app
const container = document.getElementById("root")!;
const root = createRoot(container);

// 3. Envolva o <App /> com o Provider
//renderiza o app 
// verifica que todo o app está dentro do AppProvider, assim todas as paginas conseguem acessar o contexto global
root.render(
  <React.StrictMode> 
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);