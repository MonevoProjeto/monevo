
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, PieChart } from "lucide-react";

const Investments = () => {
  const totalInvested = 25000.00;
  const totalReturn = 3420.80;
  const totalYield = ((totalReturn / totalInvested) * 100);

  const investments = [
    { 
      id: 1, 
      name: "Tesouro Direto", 
      amount: 10000.00, 
      yield: 12.5, 
      currentValue: 11250.00,
      type: "Renda Fixa"
    },
    { 
      id: 2, 
      name: "Ações PETR4", 
      amount: 8000.00, 
      yield: 8.2, 
      currentValue: 8656.00,
      type: "Renda Variável"
    },
    { 
      id: 3, 
      name: "CDB Banco XYZ", 
      amount: 7000.00, 
      yield: 10.8, 
      currentValue: 7756.00,
      type: "Renda Fixa"
    },
  ];

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-monevo-blue to-monevo-lightBlue rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Investimentos</h1>
        
        {/* Total Invested Card */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <p className="text-blue-100 text-sm mb-1">Valor Total Investido</p>
          <p className="text-3xl font-bold mb-2">
            R$ {totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-300" />
            <span className="text-green-300 font-medium">
              +{totalYield.toFixed(1)}% (+R$ {totalReturn.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Valor Atual</p>
                <p className="text-xl font-bold text-blue-700">
                  R$ {(totalInvested + totalReturn).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Rendimento</p>
                <p className="text-xl font-bold text-green-700">
                  {totalYield.toFixed(1)}%
                </p>
              </div>
              <PieChart className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investments List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-monevo-blue">Meus Investimentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {investments.map((investment) => (
            <div key={investment.id} className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{investment.name}</h3>
                  <p className="text-sm text-gray-500">{investment.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    R$ {investment.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-green-600 font-medium">+{investment.yield}%</p>
                </div>
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>Investido: R$ {investment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <span className="text-green-600">
                  +R$ {(investment.currentValue - investment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-monevo-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((investment.yield / 15) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Investments;
