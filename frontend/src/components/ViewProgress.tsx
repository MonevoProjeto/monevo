
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Target,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Plane,
  Home,
  Car
} from "lucide-react";

interface ViewProgressProps {
  onClose: () => void;
}

const ViewProgress = ({ onClose }: ViewProgressProps) => {
  const [selectedGoal, setSelectedGoal] = useState<string>("trip");

  const goals = [
    {
      id: "trip",
      title: "Viagem Europa",
      target: 15000,
      current: 10500,
      deadline: "Dezembro 2024",
      icon: Plane,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      monthlyTarget: 1500,
      monthlyActual: 1750,
      daysLeft: 275
    },
    {
      id: "house",
      title: "Casa Própria",
      target: 80000,
      current: 25000,
      deadline: "2026",
      icon: Home,
      color: "text-green-600",
      bgColor: "bg-green-50",
      monthlyTarget: 2000,
      monthlyActual: 1200,
      daysLeft: 730
    },
    {
      id: "car",
      title: "Carro Novo",
      target: 45000,
      current: 8500,
      deadline: "Junho 2025",
      icon: Car,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      monthlyTarget: 2500,
      monthlyActual: 1000,
      daysLeft: 455
    }
  ];

  const selectedGoalData = goals.find(goal => goal.id === selectedGoal)!;
  const progressPercentage = (selectedGoalData.current / selectedGoalData.target) * 100;
  const IconComponent = selectedGoalData.icon;
  const remaining = selectedGoalData.target - selectedGoalData.current;

  const monthlyProgress = [
    { month: "Jan", planned: 1500, actual: 1200, percentage: 80 },
    { month: "Fev", planned: 1500, actual: 1800, percentage: 120 },
    { month: "Mar", planned: 1500, actual: 1750, percentage: 117 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${selectedGoalData.color.includes('blue') ? 'from-blue-500 to-purple-500' : selectedGoalData.color.includes('green') ? 'from-green-500 to-blue-500' : 'from-purple-500 to-pink-500'} text-white p-4`}>
        <div className="flex items-center gap-3 mb-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-10 w-10 text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Progresso da Meta</h1>
            <p className="text-blue-100 text-sm">Acompanhe seu desenvolvimento</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <IconComponent className="h-6 w-6 text-white" />
            <span className="font-bold text-lg">{selectedGoalData.title}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-100 text-sm">{progressPercentage.toFixed(1)}% concluído</span>
            <Badge className="bg-white/20 text-white border-white/30">
              {selectedGoalData.daysLeft} dias restantes
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Goal Selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedGoal === goal.id
                  ? "bg-white text-monevo-blue shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {goal.title.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Progress Overview */}
        <Card className={selectedGoalData.bgColor}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Visão Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Progresso</span>
                <span className="text-sm font-bold text-gray-900">
                  R$ {selectedGoalData.current.toLocaleString()} / R$ {selectedGoalData.target.toLocaleString()}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs text-gray-600 text-center">
                Faltam R$ {remaining.toLocaleString()} para atingir sua meta
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <DollarSign className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Meta Mensal</p>
                <p className="font-bold text-gray-900">R$ {selectedGoalData.monthlyTarget}</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Atual Mensal</p>
                <p className="font-bold text-green-600">R$ {selectedGoalData.monthlyActual}</p>
              </div>
              <div className="text-center">
                <Calendar className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Prazo</p>
                <p className="font-bold text-gray-900">{selectedGoalData.deadline}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Progresso Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyProgress.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{month.month}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">
                      R$ {month.actual} / R$ {month.planned}
                    </span>
                    <Badge 
                      variant={month.percentage >= 100 ? "default" : "secondary"}
                      className="ml-2 text-xs"
                    >
                      {month.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={month.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance Analysis */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-1">Análise de Performance</h4>
                <p className="text-sm text-blue-800 mb-3">
                  {progressPercentage >= 70 
                    ? `Excelente! Você está ${progressPercentage > 75 ? 'muito' : ''} bem encaminhado para atingir sua meta. Continue assim!`
                    : progressPercentage >= 50
                    ? "Você está no caminho certo, mas pode acelerar um pouco o ritmo para garantir o sucesso."
                    : "Atenção! É hora de revisar sua estratégia e aumentar os aportes mensais."
                  }
                </p>
                
                {selectedGoalData.monthlyActual > selectedGoalData.monthlyTarget && (
                  <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-3">
                    <p className="text-sm text-green-800">
                      <strong>Parabéns!</strong> Você está economizando R$ {selectedGoalData.monthlyActual - selectedGoalData.monthlyTarget} 
                      a mais que o planejado. Sua meta pode ser atingida antes do prazo!
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Ajustar Meta
                  </Button>
                  <Button size="sm" variant="outline">
                    Ver Dicas
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Projeção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Se manter o ritmo atual</p>
                <p className="text-sm text-gray-600">R$ {selectedGoalData.monthlyActual}/mês</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">
                  {Math.ceil(remaining / selectedGoalData.monthlyActual)} meses
                </p>
                <p className="text-xs text-gray-600">para concluir</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Para concluir no prazo</p>
                <p className="text-sm text-gray-600">Ideal por mês</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-yellow-600">
                  R$ {Math.ceil(remaining / (selectedGoalData.daysLeft / 30))}
                </p>
                <p className="text-xs text-gray-600">necessário</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewProgress;
