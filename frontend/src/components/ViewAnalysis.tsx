
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  DollarSign,
  PieChart,
  BarChart3
} from "lucide-react";

interface ViewAnalysisProps {
  onClose: () => void;
}

const ViewAnalysis = ({ onClose }: ViewAnalysisProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");

  const analysisData = {
    category: "Delivery/Alimentação",
    increase: 40,
    currentSpending: 850,
    previousSpending: 607,
    monthlyAverage: 650,
    trend: "up",
    impact: "high"
  };

  const weeklyBreakdown = [
    { week: "Semana 1", amount: 180, orders: 6, avgOrder: 30 },
    { week: "Semana 2", amount: 220, orders: 8, avgOrder: 27.5 },
    { week: "Semana 3", amount: 280, orders: 10, avgOrder: 28 },
    { week: "Semana 4", amount: 170, orders: 5, avgOrder: 34 }
  ];

  const recommendations = [
    {
      title: "Estabeleça um limite semanal",
      description: "Defina um máximo de R$ 150/semana para delivery",
      savings: "R$ 240/mês",
      difficulty: "Fácil"
    },
    {
      title: "Cozinhe 3x por semana",
      description: "Prepare refeições em casa pelo menos 3 dias da semana",
      savings: "R$ 320/mês",
      difficulty: "Médio"
    },
    {
      title: "Use promoções e cupons",
      description: "Aproveite desconto em apps de delivery",
      savings: "R$ 85/mês",
      difficulty: "Fácil"
    }
  ];

  const periods = [
    { id: "week", label: "Esta Semana" },
    { id: "month", label: "Este Mês" },
    { id: "quarter", label: "Trimestre" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4">
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
            <h1 className="text-xl font-bold">Análise Detalhada</h1>
            <p className="text-red-100 text-sm">Gastos com Delivery</p>
          </div>
        </div>

        {/* Alert Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-6 w-6 text-yellow-300" />
            <span className="font-bold text-lg">+{analysisData.increase}% este mês</span>
          </div>
          <p className="text-red-100 text-sm">
            R$ {analysisData.currentSpending} vs R$ {analysisData.previousSpending} no mês anterior
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Period Selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {periods.map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedPeriod === period.id
                  ? "bg-white text-monevo-blue shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600 font-medium">Gasto Total</p>
                  <p className="text-xl font-bold text-red-700">R$ 850</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Pedidos</p>
                  <p className="text-xl font-bold text-orange-700">29</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Breakdown Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklyBreakdown.map((week, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{week.week}</p>
                  <p className="text-sm text-gray-600">{week.orders} pedidos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">R$ {week.amount}</p>
                  <p className="text-sm text-gray-600">Média: R$ {week.avgOrder}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <PieChart className="h-5 w-5" />
              Recomendações da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-green-200 bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {rec.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-600">
                    Economia: {rec.savings}
                  </span>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    Aplicar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Impact Analysis */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h3 className="font-bold text-yellow-800">Impacto nas Suas Metas</h3>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Este aumento nos gastos pode afetar sua meta de "Viagem Europa" em 2 meses.
            </p>
            <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700">
              Ver Impacto Detalhado
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewAnalysis;
