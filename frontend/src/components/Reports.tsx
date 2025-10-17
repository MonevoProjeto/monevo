
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, TrendingUp, Calendar, Filter } from "lucide-react";

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const periods = [
    { value: "week", label: "Esta Semana" },
    { value: "month", label: "Este Mês" },
    { value: "quarter", label: "Este Trimestre" },
    { value: "year", label: "Este Ano" },
  ];

  const categories = [
    { value: "all", label: "Todas as Categorias" },
    { value: "food", label: "Alimentação" },
    { value: "transport", label: "Transporte" },
    { value: "health", label: "Saúde" },
    { value: "education", label: "Educação" },
    { value: "entertainment", label: "Lazer" },
  ];

  const expensesByCategory = [
    { category: "Alimentação", amount: 1250.00, percentage: 38.5, color: "bg-red-500" },
    { category: "Transporte", amount: 850.00, percentage: 26.2, color: "bg-blue-500" },
    { category: "Saúde", amount: 450.00, percentage: 13.9, color: "bg-green-500" },
    { category: "Lazer", amount: 420.00, percentage: 12.9, color: "bg-purple-500" },
    { category: "Educação", amount: 270.00, percentage: 8.3, color: "bg-yellow-500" },
  ];

  const monthlyData = [
    { month: "Jan", income: 8500, expenses: 3200 },
    { month: "Fev", income: 8500, expenses: 2800 },
    { month: "Mar", income: 9200, expenses: 3100 },
    { month: "Abr", income: 8500, expenses: 2950 },
    { month: "Mai", income: 9800, expenses: 3240 },
  ];

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
              <p className="text-2xl font-bold text-green-700">R$ 9.800</p>
              <p className="text-xs text-green-600 mt-1">+15.3% vs mês anterior</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-red-600 font-medium mb-1">Total Despesas</p>
              <p className="text-2xl font-bold text-red-700">R$ 3.240</p>
              <p className="text-xs text-red-600 mt-1">+9.8% vs mês anterior</p>
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
          {expensesByCategory.map((item, index) => (
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
            {monthlyData.map((data, index) => (
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
