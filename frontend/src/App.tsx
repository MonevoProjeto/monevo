/**
 * define:
 * 1. as rotas (qual pagina abrir em cada url)
 * 2. provedores globais (tooltip, toast, cache de requisições)
 * 3. esqueleto visual base do app  
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

//cria um gerenciador de cache 
// se o app faz uma requisição repetida, o react-query usa o cache ao invés de refazer a requisição
// mais rapido e eficiente 
const queryClient = new QueryClient();


//configuração base do app 
// cada camada envolve o app e adiciona uma funcionalidade global
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster /> 
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/index" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

// queryClientProvider: cache e gerenciamento de dados --> melhora desempenho
// tooltipProvider: dicas flutuantes --> melhora UX 
// toaster/sonner: notificações globais --> tem feedback visual
// browserRouter: gerencia navegação entre paginas sem reload --> melhora roteamento 
// routes: define quais paginas abrir em cada url --> estrutura o app