
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  PiggyBank,
  Shield,
  TrendingUp,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Target,
  BarChart3
} from "lucide-react";

interface ViewReserveProps {
  onClose: () => void;
}

const ViewReserve = ({ onClose }: ViewReserveProps) => {
  const reserveData = {
    current: 6900,
    target: 6000,
    monthlyExpenses: 2300,
    monthsOfExpenses: 3,
    idealMonths: 6,
    monthlyContribution: 800,
    growthRate: 15 // percentage above target
  };

  const monthlyHistory = [
    { month: "Jan", contribution: 600, total: 5500 },
    { month: "Fev", contribution: 800, total: 6300 },
    { month: "Mar", contribution: 900, total: 6900 }
  ];

  const investmentBreakdown = [
    { type: "Poupança", amount: 4140, percentage: 60, yield: "0.5% a.m." },
    { type: "CDB", amount: 2760, percentage: 40, yield: "1.0% a.m." }
  ];

  const progressPercentage = (reserveData.current / (reserveData.monthlyExpenses * reserveData.idealMonths)) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-4">
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
            <h1 className="text-xl font-bold">Reserva de Emergência</h1>
            <p className="text-green-100 text-sm">Sua proteção financeira</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-6 w-6 text-green-200" />
            <span className="font-bold text-lg">15% acima da meta!</span>
          </div>
          <p className="text-green-100 text-sm">
            R$ {reserveData.current.toLocaleString()} de R$ {reserveData.target.toLocaleString()} planejados
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Current Status */}
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status Atual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Progresso para 6 meses</span>
                <span className="text-sm font-bold text-gray-900">
                  {(reserveData.current / reserveData.monthlyExpenses).toFixed(1)} / 6 meses
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <p className="text-xs text-gray-600 text-center">
                {progressPercentage.toFixed(1)}% da meta ideal alcançada
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <PiggyBank className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Valor Atual</p>
                <p className="font-bold text-green-600">R$ {reserveData.current.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <Calendar className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Meses Cobertos</p>
                <p className="font-bold text-gray-900">{(reserveData.current / reserveData.monthlyExpenses).toFixed(1)}</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Aporte Mensal</p>
                <p className="font-bold text-blue-600">R$ {reserveData.monthlyContribution}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição da Reserva
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {investmentBreakdown.map((investment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{investment.type}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {investment.yield}
                    </Badge>
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    R$ {investment.amount.toLocaleString()} ({investment.percentage}%)
                  </span>
                </div>
                <Progress value={investment.percentage} className="h-2" />
              </div>
            ))}
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Rendimento mensal estimado:</strong> R$ 45 
                (R$ 21 poupança + R$ 24 CDB)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Monthly History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico Mensal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {monthlyHistory.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{month.month}</p>
                  <p className="text-sm text-gray-600">Aporte: R$ {month.contribution}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">R$ {month.total.toLocaleString()}</p>
                  <p className="text-xs text-green-600">
                    +R$ {index > 0 ? month.total - monthlyHistory[index-1].total : month.contribution}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-1">Recomendação da IA</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Parabéns por estar acima da meta! Agora você pode considerar:
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mb-3">
                  <li>• Investir o excesso (R$ 900) em opções de maior rendimento</li>
                  <li>• Acelerar outras metas financeiras</li>
                  <li>• Manter os aportes atuais para chegar a 6 meses</li>
                </ul>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Ver Opções de Investimento
                  </Button>
                  <Button size="sm" variant="outline">
                    Manter Estratégia
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Protection Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Nível de Proteção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Emergências Básicas</p>
                  <p className="text-sm text-gray-600">1-3 meses cobertos</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Protegido</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Emergências Prolongadas</p>
                  <p className="text-sm text-gray-600">4-6 meses de proteção</p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Em progresso</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewReserve;
