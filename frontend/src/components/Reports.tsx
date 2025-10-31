
import { useState, useEffect } from "react";
import { listarTransacoes } from "@/api";
import type { Transaction as AppTransaction } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, TrendingUp, Calendar, Filter } from "lucide-react";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Local UI options
  const periods = [
    { value: 'week', label: 'Última semana' },
    { value: 'month', label: 'Mês atual' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Ano' },
  ];

  const categories = [
    { value: 'all', label: 'Todas' },
    { value: 'alimentacao', label: 'Alimentação' },
    { value: 'transporte', label: 'Transporte' },
    { value: 'saude', label: 'Saúde' },
    { value: 'lazer', label: 'Lazer' },
    { value: 'casa', label: 'Casa' },
    { value: 'outros', label: 'Outros' },
  ];

// Live data state
type BackendTx = AppTransaction & {
  valor?: number;
  tipo?: string; // 'receita' | 'despesa'
  categoria_cache?: string;
  categoria?: string;
  data?: string;
  data_criacao?: string;
  created_at?: string;
};

const [transactions, setTransactions] = useState<BackendTx[]>([]);
const [loading, setLoading] = useState(false);
const [totalIncome, setTotalIncome] = useState(0);
const [totalExpenses, setTotalExpenses] = useState(0);
const [byCategory, setByCategory] = useState<{ category: string; amount: number; percentage: number; color?: string }[]>([]);
const [monthly, setMonthly] = useState<{ month: string; income: number; expenses: number }[]>([]);

useEffect(() => {
  // compute date range from selectedPeriod
  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = null;

  if (selectedPeriod === 'week') {
    const day = now.getDay();
    const diffToMonday = (day + 6) % 7; // monday as start
    from = new Date(now);
    from.setDate(now.getDate() - diffToMonday);
    from.setHours(0, 0, 0, 0);
    to = new Date(from);
    to.setDate(from.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  } else if (selectedPeriod === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (selectedPeriod === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    from = new Date(now.getFullYear(), q * 3, 1);
    to = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);
  } else if (selectedPeriod === 'year') {
    from = new Date(now.getFullYear(), 0, 1);
    to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  const fetchData = async () => {
    try {
      setLoading(true);
      // call backend with date_from and date_to (FastAPI expects ISO datetimes)
      const params: Record<string, string> = {};
      if (from) params.date_from = from.toISOString();
      if (to) params.date_to = to.toISOString();

      // fetch transactions from API
      const data = await listarTransacoes(params);
      const txs = Array.isArray(data) ? (data as BackendTx[]) : [];

      // client-side category filter (selectedCategory uses our frontend keys)
      const filtered: BackendTx[] =
        selectedCategory === 'all'
          ? txs
          : txs.filter((t: BackendTx) => {
              const cat = String(
                t.categoria || t.categoria_cache || (t.category as string) || ''
              ).toLowerCase();
              return cat.includes(selectedCategory.toLowerCase());
            });

      setTransactions(filtered);

      // totals
      const income = filtered
        .filter((t: BackendTx) => t.tipo === 'receita' || t.type === 'income')
        .reduce(
          (s: number, t: BackendTx) =>
            s + (Number(t.valor ?? t.amount ?? 0) || 0),
          0
        );

      const expenses = filtered
        .filter((t: BackendTx) => t.tipo === 'despesa' || t.type === 'expense')
        .reduce(
          (s: number, t: BackendTx) =>
            s + Math.abs(Number(t.valor ?? t.amount ?? 0) || 0),
          0
        );

      setTotalIncome(income);
      setTotalExpenses(expenses);

      // by category
      const cmap: Record<string, number> = {};
      filtered.forEach((t: BackendTx) => {
        const key = String(
          t.categoria_cache || t.categoria || (t.category as string) || 'Outros'
        );
        if (t.tipo === 'despesa' || t.type === 'expense') {
          cmap[key] = (cmap[key] || 0) + Math.abs(Number(t.valor ?? t.amount ?? 0) || 0);
        }
      });

      const catArr = Object.entries(cmap).map(([category, amount]) => ({
        category,
        amount,
      }));
      const totalExp = catArr.reduce((s, c) => s + c.amount, 0) || 1;
      const colorPalette = [
        'bg-red-500',
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-yellow-500',
        'bg-indigo-500',
      ];

      setByCategory(
        catArr.map((c, i) => ({
          category: c.category,
          amount: c.amount,
          percentage: +((c.amount / totalExp) * 100).toFixed(1),
          color: colorPalette[i % colorPalette.length],
        }))
      );

      // monthly aggregation inside selected range by month label
      const monthMap: Record<string, { income: number; expenses: number }> = {};

      // build months between from and to
      if (from && to) {
        const mstart = new Date(from.getFullYear(), from.getMonth(), 1);
        const mend = new Date(to.getFullYear(), to.getMonth(), 1);
        let cur = new Date(mstart);
        while (cur <= mend) {
          const label = cur.toLocaleString('pt-BR', { month: 'short' });
          monthMap[label] = { income: 0, expenses: 0 };
          cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }
      }

      filtered.forEach((t: BackendTx) => {
        const d = new Date(t.data || t.date || t.data_criacao || t.created_at || null);
        if (isNaN(d.getTime())) return;
        const label = d.toLocaleString('pt-BR', { month: 'short' });
        if (!monthMap[label]) monthMap[label] = { income: 0, expenses: 0 };
        const val = Math.abs(Number(t.valor ?? t.amount ?? 0) || 0);
        if (t.tipo === 'receita' || t.type === 'income') monthMap[label].income += val;
        else if (t.tipo === 'despesa' || t.type === 'expense')
          monthMap[label].expenses += val;
      });

      const monthsOut = Object.entries(monthMap).map(([month, v]) => ({
        month,
        income: Math.round(v.income),
        expenses: Math.round(v.expenses),
      }));
      setMonthly(monthsOut);
    } catch (e) {
      console.error('Erro ao carregar relatórios:', e);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [selectedPeriod, selectedCategory]);


  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-monevo-blue to-monevo-lightBlue rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Relatórios</h1>
        <p className="text-blue-100">Análise detalhada das suas finanças</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-monevo-blue">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {periods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white z-50">
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-green-600 font-medium mb-1">Total Receitas</p>
              <p className="text-2xl font-bold text-green-700">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-green-600 mt-1">{loading ? 'Carregando...' : ''}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-red-600 font-medium mb-1">Total Despesas</p>
              <p className="text-2xl font-bold text-red-700">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-red-600 mt-1">{loading ? 'Carregando...' : ''}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-monevo-blue">
            <BarChart className="h-5 w-5" />
            Despesas por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {byCategory.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{item.category}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-900">
                    R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">({item.percentage}%)</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${item.color} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monthly Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-monevo-blue">
            <TrendingUp className="h-5 w-5" />
            Evolução Mensal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthly.map((data, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-monevo-blue" />
                  <span className="font-medium text-gray-900">{data.month}</span>
                </div>
                <div className="flex gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-green-600 font-medium">
                      +R$ {data.income.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-500">Receitas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-medium">
                      -R$ {data.expenses.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-500">Despesas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-monevo-blue font-bold">
                      R$ {(data.income - data.expenses).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-500">Saldo</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
