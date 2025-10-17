import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  PiggyBank,
  CreditCard,
  Lightbulb,
  MessageSquare,
  BarChart3,
  Shield,
  Calendar
} from "lucide-react";

interface AIAssistantProps {
  onNavigate?: (tab: string) => void;
}

const AIAssistant = ({ onNavigate }: AIAssistantProps) => {
  const [activeTab, setActiveTab] = useState<string>("plans");

  const aiInsights = [
    {
      id: "1",
      type: "warning",
      icon: AlertTriangle,
      title: "Gasto Alto com Delivery",
      description: "Você gastou 40% mais em delivery este mês. Isso pode impactar sua meta de viagem.",
      action: "Ver detalhes",
      priority: "high",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      id: "2",
      type: "opportunity",
      icon: TrendingUp,
      title: "Oportunidade de Investimento",
      description: "Com R$ 2.000 parados na conta, você poderia render R$ 180/mês no CDB.",
      action: "Simular investimento",
      priority: "medium",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: "3",
      type: "success",
      icon: CheckCircle,
      title: "Meta no Caminho Certo!",
      description: "Sua reserva de emergência está 15% acima do planejado. Parabéns!",
      action: "Ver progresso",
      priority: "low",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    }
  ];

  const actionPlans = [
    {
      id: "1",
      title: "Plano: Quitar Cartão de Crédito",
      description: "Estratégia personalizada para eliminar sua dívida em 3 meses",
      steps: [
        "Transfira R$ 1.200 da poupança para quitar 70% da dívida",
        "Reduza gastos com lazer em R$ 400/mês por 2 meses",
        "Use cashback do cartão de débito para acelerar pagamento"
      ],
      savings: "Economia de R$ 850 em juros",
      timeline: "3 meses",
      difficulty: "Fácil",
      icon: CreditCard,
      color: "text-red-600"
    },
    {
      id: "2",
      title: "Plano: Acelerar Reserva de Emergência",
      description: "Como chegar a 6 meses de gastos mais rapidamente",
      steps: [
        "Automatize R$ 800/mês para a reserva (todo dia 5)",
        "Invista 60% em CDB e 40% na poupança",
        "Use 13º salário integralmente para a reserva"
      ],
      savings: "Meta atingida 4 meses antes",
      timeline: "8 meses",
      difficulty: "Médio",
      icon: PiggyBank,
      color: "text-green-600"
    },
    {
      id: "3",
      title: "Plano: Otimizar Gastos Mensais",
      description: "Identifique onde cortar sem afetar qualidade de vida",
      steps: [
        "Negocie planos de streaming (economia: R$ 45/mês)",
        "Mude para plano de celular mais barato (economia: R$ 30/mês)",
        "Compre no atacado 1x/mês (economia: R$ 120/mês)"
      ],
      savings: "R$ 195/mês = R$ 2.340/ano",
      timeline: "Imediato",
      difficulty: "Fácil",
      icon: BarChart3,
      color: "text-purple-600"
    }
  ];

  const tabs = [
    { id: "plans", label: "Planos de Ação", icon: Target },
    { id: "insights", label: "Insights IA", icon: Brain },
    { id: "chat", label: "Conversar", icon: MessageSquare }
  ];

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-white/20 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">IA Monevo</h1>
            <p className="text-purple-100">Seu consultor financeiro pessoal</p>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Status da sua saúde financeira</p>
              <p className="text-xl font-bold text-white">Boa - 78/100</p>
            </div>
            <Shield className="h-8 w-8 text-purple-200" />
          </div>
          <p className="text-xs text-purple-200 mt-2">3 oportunidades de melhoria identificadas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-monevo-blue shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <IconComponent className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "plans" && (
        <div className="space-y-4">
          {actionPlans.map((plan) => {
            const IconComponent = plan.icon;
            return (
              <Card key={plan.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <IconComponent className={`h-6 w-6 ${plan.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{plan.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{plan.description}</p>
                      
                      <div className="flex gap-2 mb-4">
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          {plan.timeline}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {plan.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-green-600">
                          {plan.savings}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <h4 className="font-medium text-gray-900 text-sm">Passos do plano:</h4>
                    {plan.steps.map((step, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-monevo-blue text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-sm text-gray-700 flex-1">{step}</p>
                      </div>
                    ))}
                  </div>

                  <Button 
                    className="w-full bg-monevo-blue hover:bg-monevo-darkBlue"
                    onClick={() => onNavigate?.("activate-plan")}
                  >
                    Ativar Este Plano
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "insights" && (
        <div className="space-y-4">
          {aiInsights.map((insight) => {
            const IconComponent = insight.icon;
            return (
              <Card key={insight.id} className={`${insight.bgColor} border-l-4 ${insight.color.replace('text-', 'border-')}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <IconComponent className={`h-5 w-5 ${insight.color} mt-0.5`} />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{insight.title}</h3>
                      <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs"
                        onClick={() => {
                          if (insight.action === "Ver detalhes") {
                            onNavigate?.("view-details-insight");
                          } else if (insight.action === "Simular investimento") {
                            onNavigate?.("simulate");
                          } else if (insight.action === "Ver progresso") {
                            onNavigate?.("view-progress-goal");
                          }
                        }}
                      >
                        {insight.action}
                      </Button>
                    </div>
                    <Badge 
                      variant={insight.priority === 'high' ? 'destructive' : insight.priority === 'medium' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {insight.priority === 'high' ? 'Urgente' : insight.priority === 'medium' ? 'Médio' : 'Baixo'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === "chat" && (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 text-monevo-blue mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 mb-2">Conversar com IA</h3>
            <p className="text-gray-600 text-sm mb-4">
              Converse diretamente com a IA Monevo para tirar dúvidas e receber orientações personalizadas sobre suas finanças.
            </p>
            <Button 
              onClick={() => onNavigate?.("chat-ai")}
              className="bg-monevo-blue hover:bg-monevo-darkBlue"
            >
              Iniciar Conversa
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAssistant;
