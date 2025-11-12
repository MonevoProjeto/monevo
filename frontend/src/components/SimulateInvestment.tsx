
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  TrendingUp,
  Calculator,
  PiggyBank,
  Target,
  AlertCircle,
  CheckCircle,
  BarChart3
} from "lucide-react";

interface SimulateInvestmentProps {
  onClose: () => void;
}

const SimulateInvestment = ({ onClose }: SimulateInvestmentProps) => {
  const [amount, setAmount] = useState<string>("2000");
  const [period, setPeriod] = useState<string>("12");

  const investmentOptions = [
    {
      name: "CDB 100% CDI",
      rate: 12.5,
      risk: "Baixo",
      liquidity: "Diária",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      name: "Tesouro Selic",
      rate: 11.8,
      risk: "Muito Baixo",
      liquidity: "Diária",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      name: "Fundo DI",
      rate: 10.5,
      risk: "Baixo",
      liquidity: "D+1",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const calculateReturns = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 100 / 12;
    const finalAmount = principal * Math.pow(1 + monthlyRate, months);
    return {
      finalAmount: finalAmount,
      totalGain: finalAmount - principal,
      monthlyGain: (finalAmount - principal) / months
    };
  };

  const numAmount = parseFloat(amount) || 0;
  const numPeriod = parseInt(period) || 0;

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
            <h1 className="text-xl font-bold">Simulador de Investimento</h1>
            <p className="text-green-100 text-sm">IA Moneva - Recomendação Personalizada</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <PiggyBank className="h-6 w-6 text-green-200" />
            <span className="font-bold text-lg">R$ 2.000 parados identificados</span>
          </div>
          <p className="text-green-100 text-sm">
            Vamos transformar esse dinheiro em renda passiva!
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Configurar Simulação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor para investir
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="2000"
                className="text-lg font-bold"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período (meses)
              </label>
              <Input
                type="number"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="12"
                className="text-lg font-bold"
              />
            </div>
          </CardContent>
        </Card>

        {/* Investment Options */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Opções Recomendadas</h3>
          
          {investmentOptions.map((investment, index) => {
            const returns = calculateReturns(numAmount, investment.rate, numPeriod);
            
            return (
              <Card key={index} className={`${investment.bgColor} border-l-4 border-l-green-500`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900">{investment.name}</h4>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {investment.rate}% a.a.
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Risco {investment.risk}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {investment.liquidity}
                        </Badge>
                      </div>
                    </div>
                    <TrendingUp className={`h-6 w-6 ${investment.color}`} />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Valor Final</p>
                      <p className="font-bold text-gray-900">
                        R$ {returns.finalAmount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Ganho Total</p>
                      <p className="font-bold text-green-600">
                        +R$ {returns.totalGain.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-600">Por Mês</p>
                      <p className="font-bold text-blue-600">
                        R$ {returns.monthlyGain.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <Button className="w-full bg-monevo-blue hover:bg-monevo-darkBlue">
                    Simular Este Investimento
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* AI Recommendation */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-blue-900 mb-1">Recomendação da IA</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Com base no seu perfil conservador e na necessidade de liquidez, recomendo 
                  o <strong>CDB 100% CDI</strong>. Você terá R$ {calculateReturns(numAmount, 12.5, parseInt(period)).monthlyGain.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}/mês 
                  de renda passiva!
                </p>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Aceitar Recomendação
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
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Viagem Europa</p>
                  <p className="text-sm text-gray-600">Meta atingida 3 meses antes</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">+R$ 540</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">Reserva Emergência</p>
                  <p className="text-sm text-gray-600">Crescimento acelerado</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">+R$ 180/mês</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Lembre-se</h4>
                <p className="text-sm text-yellow-700">
                  Mantenha sempre uma reserva de emergência de 3-6 meses de gastos 
                  antes de investir valores maiores.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimulateInvestment;
