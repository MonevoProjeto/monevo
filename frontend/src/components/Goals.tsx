
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/contexts/AppContext";
import { 
  Target, 
  PlusCircle, 
  Plane, 
  CreditCard, 
  PiggyBank, 
  Home,
  Car,
  GraduationCap,
  Calendar,
  TrendingUp,
  CheckCircle2
} from "lucide-react";

interface GoalsProps {
  onNavigate?: (tab: string) => void;
}

const Goals = ({ onNavigate }: GoalsProps) => {
  const [activeGoal, setActiveGoal] = useState<string | null>(null);
  const { goals } = useApp();

  const iconMap = {
    Plane,
    CreditCard,
    PiggyBank,
    Home,
    Car,
    GraduationCap
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const targetDate = new Date(deadline);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalProgress = goals.length > 0 ? 
    goals.reduce((acc, goal) => acc + calculateProgress(goal.current, goal.target), 0) / goals.length : 0;

  const goalsOnTrack = goals.filter(goal => calculateProgress(goal.current, goal.target) >= 20).length;

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-monevo-blue to-monevo-lightBlue rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Suas Metas</h1>
            <p className="text-blue-100">Conquiste seus objetivos financeiros</p>
          </div>
          <Target className="h-8 w-8 text-blue-200" />
        </div>
        
        {/* Progress Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-blue-100 text-sm">Progresso Geral</span>
            <span className="text-white font-bold">{totalProgress.toFixed(0)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2 bg-white/20" />
          <p className="text-xs text-blue-200 mt-2">{goalsOnTrack} de {goals.length} metas no caminho certo</p>
        </div>
      </div>

      {/* Add Goal Button */}
      <Button 
        onClick={() => onNavigate?.("add-goal")}
        className="w-full bg-white border-2 border-dashed border-gray-300 text-gray-600 hover:border-monevo-blue hover:text-monevo-blue hover:bg-blue-50 py-8"
      >
        <PlusCircle className="h-5 w-5 mr-2" />
        Adicionar Nova Meta
      </Button>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const IconComponent = iconMap[goal.icon as keyof typeof iconMap] || Target;
          const progress = calculateProgress(goal.current, goal.target);
          const daysRemaining = getDaysRemaining(goal.deadline);
          const isCompleted = progress >= 100;
          
          return (
            <Card 
              key={goal.id} 
              className={`${goal.borderColor} ${goal.bgColor} transition-all duration-200 hover:shadow-md cursor-pointer`}
              onClick={() => setActiveGoal(activeGoal === goal.id ? null : goal.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${goal.bgColor} rounded-lg ${goal.borderColor} border`}>
                      <IconComponent className={`h-6 w-6 ${goal.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        {goal.title}
                        {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      </h3>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${goal.bgColor} ${goal.color}`}>
                        {goal.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(goal.current)}
                    </p>
                    <p className="text-sm text-gray-500">
                      de {formatCurrency(goal.target)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progresso</span>
                    <span className="font-medium text-gray-900">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                {/* Timeline */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Prazo vencido'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-green-600 font-medium">
                      {formatCurrency((goal.target - goal.current) / Math.max(daysRemaining, 1))} /dia
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {activeGoal === goal.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 animate-fade-in">
                    <div className="bg-white/50 rounded-lg p-3 space-y-2">
                      <h4 className="font-medium text-gray-900">💡 Dica da IA Monevo:</h4>
                      <p className="text-sm text-gray-700">
                        {goal.category === "Lazer" && "Para atingir sua meta, economize R$ 217/dia ou reduza gastos com delivery em 30%."}
                        {goal.category === "Dívidas" && "Priorize esta meta! Quite antes do prazo para economizar R$ 800 em juros."}
                        {goal.category === "Reserva" && "Excelente progresso! Continue assim e você terá segurança financeira total."}
                        {goal.category === "Moradia" && "Meta ambiciosa! Considere investir parte em renda fixa para acelerar o crescimento."}
                        {goal.category === "Veículo" && "Considere pesquisar preços e negociar financiamento para economizar."}
                        {goal.category === "Educação" && "Investimento em conhecimento sempre compensa. Considere cursos online."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-monevo-blue hover:bg-monevo-darkBlue">
                        Ver Plano de Ação
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Ajustar Meta
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Goals;
