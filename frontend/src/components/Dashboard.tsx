import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  Brain,
  Target,
  AlertTriangle,
  Lightbulb,
  Shield,
  Bell
} from "lucide-react";

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  const balance = 15420.80;
  const income = 8500.00;
  const expenses = 3240.50;
  const healthScore = 78;

  const recentTransactions = [
    { id: 1, description: "Salário", amount: 5500.00, type: "income", date: "2024-05-27", category: "Trabalho" },
    { id: 2, description: "Supermercado", amount: -350.00, type: "expense", date: "2024-05-26", category: "Alimentação" },
    { id: 3, description: "Freelance", amount: 1200.00, type: "income", date: "2024-05-25", category: "Extra" },
    { id: 4, description: "Combustível", amount: -180.00, type: "expense", date: "2024-05-24", category: "Transporte" },
  ];

  const aiInsights = [
    {
      type: "warning",
      icon: AlertTriangle,
      title: "Gastos com delivery aumentaram 40%",
      action: "Ver análise",
      actionType: "view-analysis",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      type: "tip",
      icon: Lightbulb,
      title: "Invista R$ 2.000 parados e ganhe R$ 180/mês",
      action: "Simular",
      actionType: "simulate",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    }
  ];

  const goals = [
    { name: "Viagem Europa", progress: 57, target: 15000, current: 8500 },
    { name: "Reserva Emergência", progress: 49, target: 25000, current: 12300 },
    { name: "Quitar Cartão", progress: 64, target: 5000, current: 3200 }
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Desktop: Grid layout for cards */}
      {/* Header - Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="lg:col-span-2 bg-gradient-to-r from-monevo-blue to-monevo-lightBlue border-none text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-1">Olá, João!</h1>
                <p className="text-blue-100">Bem-vindo ao Monevo</p>
              </div>
              <div className="relative lg:hidden">
                <Bell className="h-6 w-6 text-blue-200" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-blue-100 text-sm mb-1">Saldo Total</p>
              <p className="text-4xl font-bold">
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Health Score Card */}
        <Card className="border-none bg-gradient-to-br from-purple-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">Saúde Financeira IA</p>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold">{healthScore}/100</span>
                  <Badge variant="secondary" className="bg-white/20 text-white border-none">
                    Boa
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Brain className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Card */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Brain className="h-5 w-5" />
            Insights da IA Moneva
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {aiInsights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className={`${insight.bgColor} p-3 rounded-lg flex items-center gap-3`}>
                <IconComponent className={`h-5 w-5 ${insight.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => onNavigate?.(insight.actionType)}
                >
                  {insight.action}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Main Content Grid - Desktop optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Income/Expense + Goals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Income/Expense Cards */}
          <div className="grid grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Receitas</p>
                <p className="text-xl font-bold text-green-700">
                  R$ {income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Despesas</p>
                <p className="text-xl font-bold text-red-700">
                  R$ {expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-monevo-blue">
                <TrendingUp className="h-5 w-5" />
                Últimos Lançamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : ''}
                      R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - AI Insights + Goals */}
        <div className="space-y-6">
          {/* AI Insights */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Brain className="h-5 w-5" />
                Insights da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiInsights.map((insight, index) => {
                const IconComponent = insight.icon;
                return (
                  <div key={index} className={`${insight.bgColor} p-3 rounded-lg`}>
                    <div className="flex items-start gap-3 mb-2">
                      <IconComponent className={`h-5 w-5 ${insight.color} mt-0.5`} />
                      <p className="text-sm font-medium text-gray-900 flex-1">{insight.title}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full text-xs"
                      onClick={() => onNavigate?.(insight.actionType)}
                    >
                      {insight.action}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Goals Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-monevo-blue">
                <Target className="h-5 w-5" />
                Progresso das Metas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {goals.map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{goal.name}</span>
                    <span className="text-xs text-gray-500">
                      {goal.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-monevo-blue h-2 rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600">
                    R$ {goal.current.toLocaleString('pt-BR')} de R$ {goal.target.toLocaleString('pt-BR')}
                  </p>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-4" onClick={() => onNavigate?.("goals")}>
                Ver Todas as Metas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
