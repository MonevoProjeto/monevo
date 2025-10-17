
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { 
  ArrowLeft,
  Target,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  PiggyBank,
  BarChart3,
  DollarSign,
  Clock
} from "lucide-react";

interface ActivatePlanProps {
  onClose: () => void;
}

const ActivatePlan = ({ onClose }: ActivatePlanProps) => {
  const [selectedPlan, setSelectedPlan] = useState<string>("credit-card");
  const { activatePlan, activatedPlans } = useApp();
  const { toast } = useToast();

  const plans = [
    {
      id: "credit-card",
      title: "Quitar Cartão de Crédito",
      description: "Estratégia personalizada para eliminar sua dívida em 3 meses",
      icon: CreditCard,
      color: "text-red-600",
      bgColor: "bg-red-50",
      savings: "R$ 850 em juros",
      timeline: "3 meses",
      difficulty: "Fácil",
      steps: [
        "Transfira R$ 1.200 da poupança para quitar 70% da dívida",
        "Reduza gastos com lazer em R$ 400/mês por 2 meses", 
        "Use cashback do cartão de débito para acelerar pagamento"
      ]
    },
    {
      id: "emergency-fund",
      title: "Acelerar Reserva de Emergência",
      description: "Como chegar a 6 meses de gastos mais rapidamente",
      icon: PiggyBank,
      color: "text-green-600",
      bgColor: "bg-green-50",
      savings: "Meta atingida 4 meses antes",
      timeline: "8 meses",
      difficulty: "Médio",
      steps: [
        "Automatize R$ 800/mês para a reserva (todo dia 5)",
        "Invista 60% em CDB e 40% na poupança",
        "Use 13º salário integralmente para a reserva"
      ]
    },
    {
      id: "optimize-expenses",
      title: "Otimizar Gastos Mensais",
      description: "Identifique onde cortar sem afetar qualidade de vida",
      icon: BarChart3,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      savings: "R$ 195/mês = R$ 2.340/ano",
      timeline: "Imediato",
      difficulty: "Fácil",
      steps: [
        "Negocie planos de streaming (economia: R$ 45/mês)",
        "Mude para plano de celular mais barato (economia: R$ 30/mês)",
        "Compre no atacado 1x/mês (economia: R$ 120/mês)"
      ]
    }
  ];

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan)!;
  const IconComponent = selectedPlanData.icon;
  const isAlreadyActivated = activatedPlans.some(plan => plan.id === selectedPlan);

  const handleActivatePlan = () => {
    activatePlan(selectedPlan, selectedPlanData.title);
    toast({
      title: "✅ Plano Ativado com Sucesso!",
      description: `O plano "${selectedPlanData.title}" foi ativado. Você receberá lembretes e acompanhamento automático.`,
    });
    onClose();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-monevo-blue to-purple-600 text-white p-4">
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
            <h1 className="text-xl font-bold">Ativar Plano de Ação</h1>
            <p className="text-blue-100 text-sm">IA Monevo - Personalização Final</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-6 w-6 text-blue-200" />
            <span className="font-bold text-lg">Planos Disponíveis</span>
          </div>
          <p className="text-blue-100 text-sm">
            Escolha o plano que melhor se adapta ao seu momento atual
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Active Plans Summary */}
        {activatedPlans.length > 0 && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-bold text-green-900">Planos Ativos ({activatedPlans.length})</h3>
              </div>
              <div className="space-y-2">
                {activatedPlans.map((plan) => (
                  <div key={plan.id} className="text-sm text-green-700">
                    • {plan.title} - Ativado em {plan.activatedAt.toLocaleDateString('pt-BR')}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Selector */}
        <div className="space-y-3">
          <h3 className="font-bold text-gray-900">Selecione um Plano:</h3>
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const isActivated = activatedPlans.some(activePlan => activePlan.id === plan.id);
            return (
              <Card 
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-monevo-blue border-monevo-blue' 
                    : 'hover:shadow-md'
                } ${isActivated ? 'opacity-60' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${plan.bgColor} rounded-lg`}>
                      <PlanIcon className={`h-5 w-5 ${plan.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        {plan.title}
                        {isActivated && <Badge className="bg-green-100 text-green-800">Ativo</Badge>}
                      </h4>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs mb-1">
                        {plan.timeline}
                      </Badge>
                      <p className="text-xs text-green-600 font-medium">{plan.savings}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Selected Plan Details */}
        <Card className={`${selectedPlanData.bgColor} border-l-4 ${selectedPlanData.color.replace('text-', 'border-')}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <IconComponent className={`h-6 w-6 ${selectedPlanData.color}`} />
              {selectedPlanData.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Clock className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Prazo</p>
                <p className="font-bold text-gray-900">{selectedPlanData.timeline}</p>
              </div>
              <div className="text-center">
                <Target className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Dificuldade</p>
                <p className="font-bold text-gray-900">{selectedPlanData.difficulty}</p>
              </div>
              <div className="text-center">
                <DollarSign className="h-5 w-5 text-gray-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600">Economia</p>
                <p className="font-bold text-green-600">{selectedPlanData.savings}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Passos do Plano:</h4>
              {selectedPlanData.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-monevo-blue text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 flex-1">{step}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activation Confirmation */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-green-900 mb-1">Confirmar Ativação</h4>
                <p className="text-sm text-green-800">
                  Ao ativar este plano, a IA Monevo irá:
                </p>
                <ul className="text-sm text-green-700 mt-2 space-y-1">
                  <li>• Configurar lembretes automáticos</li>
                  <li>• Monitorar seu progresso</li>
                  <li>• Ajustar estratégias conforme necessário</li>
                  <li>• Enviar alertas sobre oportunidades</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={handleActivatePlan}
                disabled={isAlreadyActivated}
              >
                {isAlreadyActivated ? "Plano Já Ativo" : "Ativar Plano Agora"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Importante</h4>
                <p className="text-sm text-yellow-700">
                  Você pode pausar ou modificar este plano a qualquer momento nas configurações.
                  A IA se adaptará às suas mudanças de circunstância.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivatePlan;
