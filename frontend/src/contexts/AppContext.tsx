
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { listarMetas, criarMeta as criarMetaAPI, atualizarMeta as atualizarMetaAPI, deletarMeta as deletarMetaAPI } from '../api';
import { toast } from 'sonner';


// API meta shape
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

export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'investment';
  category: string;
  description: string;
  amount: number;
  date: string; // ISO
}


export interface Goal {
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
  transactions: Transaction[];
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (goalId: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  refreshTransactions: () => Promise<void>;
  refreshGoals: () => Promise<void>;
  activatedPlans: ActivatedPlan[];
  activatePlan: (planId: string, planTitle: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Mapeamento de categorias para ícones e cores
// Category defaults (frontend mapping)
const categoryMapping: Record<string, { icon: string; color: string; bgColor: string; borderColor: string }> = {
  Viagem: { icon: 'Plane', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'Quitar Dívida': { icon: 'CreditCard', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  Reserva: { icon: 'PiggyBank', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  'Casa/Imóvel': { icon: 'Home', color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  Veículo: { icon: 'Car', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  Educação: { icon: 'GraduationCap', color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
 };
 

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activatedPlans, setActivatedPlans] = useState<ActivatedPlan[]>([]);

  // Converter meta da API para formato do frontend
  const convertApiMetaToGoal = (apiMeta: ApiMeta): Goal => {
    const categoryInfo = categoryMapping[apiMeta.categoria] || { icon: 'Target', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' };
    
    return {
      id: String(apiMeta.id),
      title: apiMeta.titulo,
      description: apiMeta.descricao || '',
      target: apiMeta.valor_objetivo,
      current: apiMeta.valor_atual,
      deadline: apiMeta.prazo || '',
      category: apiMeta.categoria,
      icon: categoryInfo.icon,
      color: categoryInfo.color,
      bgColor: categoryInfo.bgColor,
      borderColor: categoryInfo.borderColor,
    };
  };

  const convertGoalToApiMeta = (goal: Omit<Goal, 'id'> | Partial<Goal>) => ({
    titulo: goal.title,
    descricao: goal.description || null,
    categoria: goal.category,
    valor_objetivo: goal.target,
    valor_atual: goal.current,
    prazo: goal.deadline || null,
  });

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
      setGoals(prev => prev.map(g => g.id === goalId ? convertedGoal : g));
    } catch (err) {
      console.error('Erro ao atualizar meta:', err);
      throw err;
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      setLoading(true);
      await deletarMetaAPI(Number(goalId));
      setGoals(prev => prev.filter(g => g.id !== goalId));
      toast.success('Meta excluída com sucesso');
    } catch (e) {
      console.error('Erro ao excluir meta:', e);
      toast.error('Não foi possível excluir a meta');
    } finally {
      setLoading(false);
    }
  };

  // Recarregar metas
  const refreshGoals = async () => {
    await loadGoals();
  };

  const loadTransactions = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'}/transacoes`
    );
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    type BackendTx = {
      id?: number;
      usuario_id?: number;
      tipo?: string;
      categoria?: string;
      categoria_nome?: string;
      descricao?: string;
      valor?: number;
      data?: string;
    };
    const converted: Transaction[] = (data || []).map((t: BackendTx) => ({
      id: String(t.id ?? t.usuario_id ?? Date.now()),
      type:
        t.tipo === 'receita'
          ? 'income'
          : t.tipo === 'despesa'
          ? 'expense'
          : 'investment',
      category: t.categoria || t.categoria_nome || '',
      description: t.descricao || '',
      amount: Number(t.valor ?? 0),
      date: t.data || new Date().toISOString(),
    }));
    setTransactions(converted);
  } catch (err) {
    console.warn('Could not load transactions from API', err);
  }
};

const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
  const tempId = String(Date.now());
  const newTx: Transaction = { id: tempId, ...tx };
  setTransactions((prev) => [newTx, ...prev]);

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'}/transacoes`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: Number(import.meta.env.VITE_DEFAULT_USER_ID ?? 1),
          data: tx.date,
          valor: tx.amount,
          tipo:
            tx.type === 'income'
              ? 'receita'
              : tx.type === 'expense'
              ? 'despesa'
              : 'investimento',
          descricao: tx.description,
          categoria: tx.category,
        }),
      }
    );

    if (res.ok) {
      const created = await res.json();
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === tempId
            ? {
                id: String(created.id ?? tempId),
                type: tx.type,
                category: tx.category,
                description: tx.description,
                amount: tx.amount,
                date: tx.date,
              }
            : t
        )
      );
    }
  } catch (e) {
    console.warn('Failed to post transaction to API', e);
  }
};

const refreshTransactions = async () => {
  await loadTransactions();
};


  const activatePlan = (planId: string, planTitle: string) => {
  const plan: ActivatedPlan = { id: planId, title: planTitle, activatedAt: new Date() };
    setActivatedPlans(prev => [...prev, plan]);
  };

  // Carregar metas na inicialização
  useEffect(() => {
    loadGoals();
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppContext.Provider value={{
      goals,
      loading,
      error,
      transactions,
      addGoal,
      updateGoal,
      deleteGoal,
      refreshGoals,
      addTransaction,
      refreshTransactions,
      activatedPlans,
      activatePlan,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useApp must be used within an AppProvider');
  return context;
};
