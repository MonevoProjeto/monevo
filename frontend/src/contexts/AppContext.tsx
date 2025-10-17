
import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  activatedPlans: ActivatedPlan[];
  activatePlan: (planId: string, planTitle: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      title: "Viagem para Europa",
      description: "Férias dos sonhos em dezembro",
      target: 15000,
      current: 8500,
      deadline: "2024-12-01",
      icon: "Plane",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      category: "Lazer"
    },
    {
      id: "2", 
      title: "Quitar Cartão de Crédito",
      description: "Eliminar dívida do cartão",
      target: 5000,
      current: 3200,
      deadline: "2024-08-01",
      icon: "CreditCard",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      category: "Dívidas"
    },
    {
      id: "3",
      title: "Reserva de Emergência",
      description: "6 meses de gastos guardados",
      target: 25000,
      current: 12300,
      deadline: "2025-01-01",
      icon: "PiggyBank",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      category: "Reserva"
    },
    {
      id: "4",
      title: "Entrada do Apartamento",
      description: "20% do valor do imóvel",
      target: 80000,
      current: 15600,
      deadline: "2025-06-01",
      icon: "Home",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      category: "Moradia"
    }
  ]);

  const [activatedPlans, setActivatedPlans] = useState<ActivatedPlan[]>([]);

  const addGoal = (newGoal: Omit<Goal, 'id'>) => {
    const goal: Goal = {
      ...newGoal,
      id: Date.now().toString()
    };
    setGoals(prev => [...prev, goal]);
  };

  const activatePlan = (planId: string, planTitle: string) => {
    const plan: ActivatedPlan = {
      id: planId,
      title: planTitle,
      activatedAt: new Date()
    };
    setActivatedPlans(prev => [...prev, plan]);
  };

  return (
    <AppContext.Provider value={{ goals, addGoal, activatedPlans, activatePlan }}>
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
