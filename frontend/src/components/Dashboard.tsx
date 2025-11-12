import { useMemo } from "react";
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
  Bell,
  BarChart3,
  PieChart as PieChartIcon,
  Plus,
  CreditCard,
  Wallet
} from "lucide-react";


import { useApp } from "@/contexts/AppContext";

import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
  onSetTransactionsFilter?: (filter: "all" | "income" | "expense") => void;
}

const Dashboard = ({ onNavigate, onSetTransactionsFilter }: DashboardProps) => {
  const { transactions, goals, currentUser } = useApp();

  const income = useMemo(() => transactions
    .filter(t => t.type === 'income')
    .reduce((s, t) => s + (t.amount || 0), 0), [transactions]);

  const expenses = useMemo(() => transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + (t.amount || 0), 0), [transactions]);

  const balance = useMemo(() => income - expenses, [income, expenses]);
  const healthScore = 78;

  const recentTransactions = useMemo(() => {
    if (!transactions) return [];
    // sort by date desc and take first 4
    return [...transactions]
      .sort((a, b) => {
        const da = new Date(a.date).getTime() || 0;
        const db = new Date(b.date).getTime() || 0;
        return db - da;
      })
      .slice(0, 4);
  }, [transactions]);

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

  // use goals from context (converted from API)
  // compute progress percentage for each goal
  const visibleGoals = (goals || []).slice(0, 3).map(g => ({
    id: g.id,
    name: g.title,
    target: g.target || 0,
    current: g.current || 0,
    progress: g.target ? Math.round((g.current / g.target) * 100) : 0,
  }));

  // Dados para gráficos derivados de `transactions`
  const monthsPt = [
    'Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'
   ];
 
  const lastNMonths = (n = 6) => {
    const res: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthsPt[d.getMonth()]}`;
      res.push({ key, label });
    }
    return res;
  };

  const months = lastNMonths(6);

  // initialize monthly aggregates
  const monthlyAgg: Record<string, { receitas: number; despesas: number }> = {};
  months.forEach(m => (monthlyAgg[m.key] = { receitas: 0, despesas: 0 }));

 (transactions || []).forEach((t) => {
    try {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyAgg[key]) return; // ignore outside range
  const amount = Number(t.amount ?? 0) || 0;
      if (t.type === 'income') monthlyAgg[key].receitas += amount;
      else if (t.type === 'expense') monthlyAgg[key].despesas += Math.abs(amount);
      else if (t.type === 'investment') {
        // treat investments as expense for visualization (optional)
       monthlyAgg[key].despesas += Math.abs(amount);
      }
    } catch (e) {
      // ignore parse errors
    }
  });

  // income vs expenses per month
  const incomeVsExpenses = months.map(m => ({
    month: m.label,
    receitas: Math.round(monthlyAgg[m.key].receitas),
    despesas: Math.round(monthlyAgg[m.key].despesas),
  }));

  // balance evolution (cumulative)
  const balanceEvolution: { month: string; saldo: number }[] = [];
  let running = 0;
  incomeVsExpenses.forEach(item => {
    running += (item.receitas - item.despesas);
    balanceEvolution.push({ month: item.month, saldo: Math.round(running) });
  });

  // category expenses (top 5)
  const catMap: Record<string, number> = {};
  (transactions || []).forEach(t => {
    if (t.type !== 'expense') return;
    const cat = t.category || 'Outros';
  const amt = Math.abs(Number(t.amount ?? 0) || 0);
    catMap[cat] = (catMap[cat] || 0) + amt;
  });

  const categoryArr = Object.entries(catMap).map(([name, value]) => ({ name, value }));
  categoryArr.sort((a, b) => b.value - a.value);
  const palette = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  const top = categoryArr.slice(0, 5).map((c, i) => ({ name: c.name, value: Math.round(c.value), color: palette[i % palette.length] }));
  const others = categoryArr.slice(5).reduce((s, c) => s + c.value, 0);
  const categoryExpenses = others > 0 ? [...top, { name: 'Outros', value: Math.round(others), color: 'hsl(var(--chart-6))' }] : top;

  return (
    <div className="space-y-6 animate-fade-in w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Desktop: Grid layout for cards */}
      {/* Header - Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="lg:col-span-2 bg-gradient-to-r from-monevo-blue to-monevo-lightBlue border-none text-white">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
              <div>
                <h1 className="text-2xl font-bold mb-1">Olá, {currentUser?.nome ?? 'amigo'}!</h1>
                <p className="text-blue-100">Bem-vindo ao Monevo</p>
              </div>
              <div className="relative lg:hidden">
                <Bell className="h-6 w-6 text-blue-200" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4">
              <p className="text-blue-100 text-sm mb-1">Saldo Total</p>
              <p className="text-4xl font-bold">
                R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Health Score Card */}
        <Card className="border-none bg-gradient-to-br from-purple-500 to-blue-600 text-white">
          <CardContent className="p-4 sm:p-6">
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
        <CardContent className="space-y-3 p-4 sm:p-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className="border-green-200 bg-green-50 cursor-pointer"
          onClick={() => {
            onSetTransactionsFilter?.('income');
            onNavigate?.('transactions');
          }}
        >
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

        <Card
          className="border-red-200 bg-red-50 cursor-pointer"
          onClick={() => {
            onSetTransactionsFilter?.('expense');
            onNavigate?.('transactions');
          }}
        >
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
            <CardContent className="space-y-3 p-4 sm:p-6">
              {recentTransactions.map((transaction) => {
                const dateObj = new Date(transaction.date);
                const formattedDate = isNaN(dateObj.getTime()) ? transaction.date : dateObj.toLocaleDateString('pt-BR');
                return (
                <div
                  key={transaction.id}
                  role="button"
                  onClick={() => onNavigate?.('transactions')}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
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
                      {transaction.type === 'income' ? '+' : '-'} R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500">{formattedDate}</p>
                  </div>
                </div>
             );
              })}
        </CardContent>

{/* Ações Rápidas */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-monevo-blue">
                <Wallet className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button 
                  className="flex flex-col items-center gap-2 h-auto py-4 bg-white hover:bg-blue-50 border-2 border-blue-200 text-monevo-blue w-full"
                  variant="outline"
                  onClick={() => onNavigate?.("add")}
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-sm font-semibold">Nova Transação</span>
                </Button>
                
                <Button 
                  className="flex flex-col items-center gap-2 h-auto py-4 bg-white hover:bg-green-50 border-2 border-green-200 text-green-600 w-full"
                  variant="outline"
                  onClick={() => onNavigate?.("goals")}
                >
                  <Target className="h-6 w-6" />
                  <span className="text-sm font-semibold">Ver Metas</span>
                </Button>
                
                <Button 
                  className="flex flex-col items-center gap-2 h-auto py-4 bg-white hover:bg-purple-50 border-2 border-purple-200 text-purple-600 w-full"
                  variant="outline"
                  onClick={() => onNavigate?.("reports")}
                >
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm font-semibold">Relatórios</span>
                </Button>
              </div>

          </CardContent>
           </Card>
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
            <CardContent className="space-y-3 p-4 sm:p-6">
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
            <CardContent className="space-y-4 p-4 sm:p-6">
              {visibleGoals.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma meta cadastrada</p>
              )}

              {visibleGoals.map((goal) => (
                <div key={goal.id} className="space-y-2">
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
{/* Gráficos de Análise Visual */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-monevo-blue">
      <BarChart3 className="h-5 w-5" />
      Análise Visual
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Evolução do Saldo */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Evolução do Saldo</h3>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={balanceEvolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="saldo" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gastos por Categoria */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">Gastos por Categoria</h3>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            {categoryExpenses.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Nenhuma despesa por categoria
              </div>
            ) : (
              <PieChart>
                <Pie
                  data={categoryExpenses}
                  dataKey="value"
                  cx="40%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={80}
                  paddingAngle={4}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {categoryExpenses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => 
                    `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  }
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Receitas vs Despesas */}
      <div className="space-y-2 lg:col-span-2">
        <h3 className="text-sm font-semibold text-gray-700">Receitas vs Despesas</h3>
        <div className="h-48 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={incomeVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="receitas" fill="#10b981" radius={[8, 8, 0, 0]} name="Receitas" />
              <Bar dataKey="despesas" fill="#ef4444" radius={[8, 8, 0, 0]} name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  </CardContent>
</Card>

    </div>
  );
};

export default Dashboard;
