
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { listarMetas, criarMeta as criarMetaAPI, atualizarMeta as atualizarMetaAPI, deletarMeta as deletarMetaAPI } from '../api';
import { toast } from 'sonner'


// Interface para os dados que vêm da API
interface ApiMeta {
  id: number;
  titulo: string;
  descricao: string | null;
  categoria: string;
  valor_objetivo: number;
  valor_atual: number;
  prazo: string | null;
  data_criacao: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  deadline: string;
  category: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface ActivatedPlan {
  id: string;
  title: string;
  activatedAt: Date;
}

interface AppContextType {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (goalId: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  refreshGoals: () => Promise<void>;
  activatedPlans: ActivatedPlan[];
  activatePlan: (planId: string, planTitle: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mapeamento de categorias para ícones e cores
const categoryMapping = {
  "Viagem": { icon: "Plane", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
  "Quitar Dívida": { icon: "CreditCard", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
  "Reserva": { icon: "PiggyBank", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
  "Casa/Imóvel": { icon: "Home", color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
  "Veículo": { icon: "Car", color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
  "Educação": { icon: "GraduationCap", color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatedPlans, setActivatedPlans] = useState<ActivatedPlan[]>([]);

  // Converter meta da API para formato do frontend
  const convertApiMetaToGoal = (apiMeta: ApiMeta): Goal => {
    const categoryInfo = categoryMapping[apiMeta.categoria as keyof typeof categoryMapping] || 
                       { icon: "Target", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" };
    
    return {
      id: apiMeta.id.toString(),
      title: apiMeta.titulo,
      description: apiMeta.descricao || "",
      target: apiMeta.valor_objetivo,
      current: apiMeta.valor_atual,
      deadline: apiMeta.prazo || "",
      category: apiMeta.categoria,
      icon: categoryInfo.icon,
      color: categoryInfo.color,
      bgColor: categoryInfo.bgColor,
      borderColor: categoryInfo.borderColor
    };
  };

  // Converter goal do frontend para formato da API
  const convertGoalToApiMeta = (goal: Omit<Goal, 'id'> | Partial<Goal>) => {
    return {
      titulo: goal.title,
      descricao: goal.description || null,
      categoria: goal.category,
      valor_objetivo: goal.target,
      valor_atual: goal.current,
      prazo: goal.deadline || null
    };
  };

  // Carregar metas do backend
  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiMetas = await listarMetas();
      const convertedGoals = apiMetas.map(convertApiMetaToGoal);
      setGoals(convertedGoals);
    } catch (err) {
      console.error('Erro ao carregar metas:', err);
      setError('Erro ao carregar metas. Verifique se o backend está rodando.');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar nova meta
  const addGoal = async (newGoal: Omit<Goal, 'id'>) => {
    try {
      const apiMeta = convertGoalToApiMeta(newGoal);
      const createdMeta = await criarMetaAPI(apiMeta);
      const convertedGoal = convertApiMetaToGoal(createdMeta);
      setGoals(prev => [...prev, convertedGoal]);
    } catch (err) {
      console.error('Erro ao criar meta:', err);
      throw err;
    }
  };

  // Atualizar meta existente
  const updateGoal = async (goalId: string, goalData: Partial<Goal>) => {
    try {
      const apiMeta = convertGoalToApiMeta(goalData);
      const updatedMeta = await atualizarMetaAPI(parseInt(goalId), apiMeta);
      const convertedGoal = convertApiMetaToGoal(updatedMeta);
      setGoals(prev => prev.map(goal => goal.id === goalId ? convertedGoal : goal));
    } catch (err) {
      console.error('Erro ao atualizar meta:', err);
      throw err;
    }
  };

const deleteGoal = async (goalId: string): Promise<void> => {
  try {
    setLoading(true)
    await deletarMetaAPI(Number(goalId))
    setGoals(prev => prev.filter(g => g.id !== goalId))
    toast.success('Meta excluída com sucesso')
  } catch (e) {
    console.error('Erro ao excluir meta:', e)
    toast.error('Não foi possível excluir a meta')
  } finally {
    setLoading(false)
  }
}

  // Recarregar metas
  const refreshGoals = async () => {
    await loadGoals();
  };

  const activatePlan = (planId: string, planTitle: string) => {
    const plan: ActivatedPlan = {
      id: planId,
      title: planTitle,
      activatedAt: new Date()
    };
    setActivatedPlans(prev => [...prev, plan]);
  };

  // Carregar metas na inicialização
  useEffect(() => {
    loadGoals();
  }, []);

  return (
    <AppContext.Provider value={{ 
      goals, 
      loading, 
      error, 
      addGoal, 
      updateGoal, 
      deleteGoal, 
      refreshGoals,
      activatedPlans, 
      activatePlan 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
