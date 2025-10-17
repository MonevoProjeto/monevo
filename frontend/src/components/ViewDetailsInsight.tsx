
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3,
  PieChart,
  Target,
  Lightbulb,
  CheckCircle
} from "lucide-react";

interface ViewDetailsInsightProps {
  onClose: () => void;
}

const ViewDetailsInsight = ({ onClose }: ViewDetailsInsightProps) => {
  const [selectedInsight, setSelectedInsight] = useState<string>("delivery");

  const insights = [
    {
      id: "delivery",
      type: "warning",
      title: "Gasto Alto com Delivery",
      description: "Você gastou 40% mais em delivery este mês",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      currentValue: "R$ 850",
      previousValue: "R$ 607",
      impact: "Alta",
      trend: "up",
      details: {
        category: "Alimentação",
        period: "Março 2024",
        frequency: "29 pedidos",
        avgOrder: "R$ 29,30",
        peakDays: ["Sexta", "Sábado", "Domingo"],
        topApps: ["iFood", "Uber Eats", "Rappi"]
      }
    },
    {
      id: "investment",
      type: "opportunity",
      title: "Oportunidade de Investimento",
      description: "R$ 2.000 parados na conta podem render mais",
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      currentValue: "R$ 2.000",
      previousValue: "R$ 0",
      impact: "Média",
      trend: "neutral",
      details: {
        category: "Investimentos",
        period: "Disponível agora",
        frequency: "Mensal",
        avgOrder: "R$ 180/mês",
        peakDays: ["Qualquer dia"],
        topApps: ["CDB", "Tesouro", "Fundos"]
      }
    },
    {
      id: "emergency",
      type: "success",
      title: "Reserva de Emergência",
      description: "15% acima do planejado - Parabéns!",
      icon: CheckCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      currentValue: "R$ 6.900",
      previousValue: "R$ 6.000",
      impact: "Baixa",
      trend: "up",
      details: {
        category: "Reserva",
        period: "Março 2024",
        frequency: "Mensal",
        avgOrder: "R$ 800/mês",
        peakDays: ["Todo dia 5"],
        topApps: ["Poupança", "CDB"]
      }
    }
  ];

  const selectedInsightData = insights.find(insight => insight.id === selectedInsight)!;
  const IconComponent = selectedInsightData.icon;

  const weeklyData = [
    { week: "Semana 1", value: 180, percentage: 20 },
    { week: "Semana 2", value: 220, percentage: 25 },
    { week: "Semana 3", value: 280, percentage: 35 },
    { week: "Semana 4", value: 170, percentage: 20 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${selectedInsightData.type === 'warning' ? 'from-red-500 to-orange-500' : selectedInsightData.type === 'opportunity' ? 'from-green-500 to-blue-500' : 'from-blue-500 to-purple-500'} text-white p-4`}>
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
            <h1 className="text-xl font-bold">Detalhes do Insight</h1>
            <p className="text-blue-100 text-sm">IA Monevo - Análise Detalhada</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <IconComponent className="h-6 w-6 text-white" />
            <span className="font-bold text-lg">{selectedInsightData.title}</span>
          </div>
          <p className="text-blue-100 text-sm">
            {selectedInsightData.description}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Insight Selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {insights.map((insight) => (
            <button
              key={insight.id}
              onClick={() => setSelectedInsight(insight.id)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                selectedInsight === insight.id
                  ? "bg-white text-monevo-blue shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {insight.title.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <Card className={selectedInsightData.bgColor}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Atual</p>
                  <p className="text-xl font-bold text-gray-900">{selectedInsightData.currentValue}</p>
                </div>
                <DollarSign className={`h-8 w-8 ${selectedInsightData.color}`} />
              </div>
            </CardContent>
          </Card>

          <Card className={selectedInsightData.bgColor}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Impacto</p>
                  <p className="text-xl font-bold text-gray-900">{selectedInsightData.impact}</p>
                </div>
                <BarChart3 className={`h-8 w-8 ${selectedInsightData.color}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Informações Detalhadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Categoria</p>
                  <p className="font-bold text-gray-900">{selectedInsightData.details.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Período</p>
                  <p className="font-bold text-gray-900">{selectedInsightData.details.period}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Frequência</p>
                  <p className="font-bold text-gray-900">{selectedInsightData.details.frequency}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                  <p className="font-bold text-gray-900">{selectedInsightData.details.avgOrder}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Dias de Pico</p>
                  <p className="font-bold text-gray-900">{selectedInsightData.details.peakDays.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Principais</p>
                  <p className="font-bold text-gray-900">{selectedInsightData.details.topApps.join(', ')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Breakdown Semanal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {weeklyData.map((week, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900">{week.week}</span>
                  <span className="text-sm font-bold text-gray-900">R$ {week.value}</span>
                </div>
                <Progress value={week.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-1">Recomendação da IA</h4>
                <p className="text-sm text-blue-800 mb-3">
                  {selectedInsightData.type === 'warning' && 
                    "Estabeleça um limite semanal de R$ 150 para delivery e cozinhe pelo menos 3x por semana para economizar R$ 240/mês."
                  }
                  {selectedInsightData.type === 'opportunity' && 
                    "Invista R$ 2.000 em CDB 100% CDI para gerar R$ 180/mês de renda passiva sem riscos."
                  }
                  {selectedInsightData.type === 'success' && 
                    "Continue mantendo sua disciplina! Considere investir o excesso da reserva para acelerar suas metas."
                  }
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Aplicar Sugestão
                  </Button>
                  <Button size="sm" variant="outline">
                    Ver Outras Opções
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Impact on Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Impacto nas Suas Metas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-900">Viagem Europa</p>
                  <p className="text-sm text-gray-600">Pode ser afetada em 2 meses</p>
                </div>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewDetailsInsight;
