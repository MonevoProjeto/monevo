
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  Target,
  CheckCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Plane,
  AlertTriangle,
  Lightbulb
} from "lucide-react";

interface ViewProgressGoalProps {
  onClose: () => void;
}

const ViewProgressGoal = ({ onClose }: ViewProgressGoalProps) => {
  const goalData = {
    title: "Viagem Europa",
    target: 15000,
    current: 10500,
    deadline: "Dezembro 2024",
    monthlyTarget: 1500,
    monthlyActual: 1750,
    daysLeft: 275,
    category: "Lazer"
  };

  const progressPercentage = (goalData.current / goalData.target) * 100;
  const remaining = goalData.target - goalData.current;

  const milestones = [
    { title: "25% da meta", amount: 3750, completed: true, date: "Jan 2024" },
    { title: "50% da meta", amount: 7500, completed: true, date: "Fev 2024" },
    { title: "70% da meta", amount: 10500, completed: true, date: "Mar 2024" },
    { title: "100% da meta", amount: 15000, completed: false, date: "Dez 2024" }
  ];

  const monthlyProgress = [
    { month: "Jan", target: 1500, actual: 1200, percentage: 80 },
    { month: "Fev", target: 1500, actual: 1800, percentage: 120 },
    { month: "Mar", target: 1500, actual: 1750, percentage: 117 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-4">
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
            <p className="text-blue-100 text-sm">{goalData.title}</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-6 w-6 text-green-300" />
            <span className="font-bold text-lg">70% Concluída!</span>
          </div>
          <p className="text-blue-100 text-sm">
            R$ {goalData.current.toLocaleString()} de R$ {goalData.target.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Progress Overview */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              {goalData.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Progresso</span>
                <span className="text-sm font-bold text-gray-900">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs text-gray-600 text-center">
                Faltam R$ {remaining.toLocaleString()} para sua viagem dos sonhos
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <DollarSign className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Meta Mensal</p>
                <p className="font-bold text-gray-900">R$ {goalData.monthlyTarget}</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Atual Mensal</p>
                <p className="font-bold text-green-600">R$ {goalData.monthlyActual}</p>
              </div>
              <div className="text-center">
                <Calendar className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Prazo</p>
                <p className="font-bold text-gray-900">{goalData.deadline}</p>
              </div>
            </div>

            <div className="bg-green-100 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <strong>Parabéns!</strong> Você está economizando R$ 250 a mais que o planejado por mês. 
                Sua meta pode ser atingida em <strong>Outubro</strong> (2 meses antes)!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Marcos da Meta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestones.map((milestone, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  milestone.completed ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className={`h-5 w-5 ${milestone.completed ? 'text-green-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`font-medium ${milestone.completed ? 'text-gray-900' : 'text-gray-600'}`}>
                      {milestone.title}
                    </p>
                    <p className="text-sm text-gray-600">R$ {milestone.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge 
                    variant={milestone.completed ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {milestone.completed ? "Concluído" : "Pendente"}
                  </Badge>
                  <p className="text-xs text-gray-600 mt-1">{milestone.date}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Performance Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyProgress.map((month, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{month.month}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">
                      R$ {month.actual} / R$ {month.target}
                    </span>
                    <Badge 
                      variant={month.percentage >= 100 ? "default" : "secondary"}
                      className="ml-2 text-xs"
                    >
                      {month.percentage}%
                    </Badge>
                  </div>
                </div>
                <Progress value={month.percentage > 100 ? 100 : month.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-1">Insights da IA</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Com sua performance atual, você pode:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mb-3">
                  <li>• Atingir a meta 2 meses antes (Outubro 2024)</li>
                  <li>• Aumentar o orçamento da viagem em R$ 500</li>
                  <li>• Manter o ritmo e criar uma segunda meta</li>
                </ul>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Ajustar Meta
                  </Button>
                  <Button size="sm" variant="outline">
                    Manter Atual
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact Analysis */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Atenção</h4>
                <p className="text-sm text-yellow-700">
                  O aumento nos gastos com delivery pode impactar esta meta. 
                  Considere ajustar o orçamento para manter o cronograma.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewProgressGoal;
