import { useState, useMemo, useEffect } from "react";
import { ArrowUpRight, ArrowDownRight, Filter, Search, Calendar, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/contexts/AppContext";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface Transaction {
  id: string;
  type: "income" | "expense" | "investment";
  category: string;
  description: string;
  amount: number;
  date: string;
}

const Transactions = ({ initialFilter }: { initialFilter?: "all" | "income" | "expense" }) => {
  const [filter, setFilter] = useState<"all" | "income" | "expense">(initialFilter ?? "all");
  useEffect(() => {
    setFilter(initialFilter ?? "all");
  }, [initialFilter]);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodOpen, setPeriodOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  
  const { transactions, deleteTransaction } = useApp();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // helper para pegar o nome da categoria vindo do backend
  const getCategoryLabel = (tx: any): string => {
    return (
      tx.category ??          // caso já venha normalizado
      tx.categoria_cache ??   // campo do backend
      tx.categoria ??         // outro campo possível
      "Outros"
    );
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesFilter = filter === "all" || transaction.type === filter;
    const catLabel = getCategoryLabel(transaction);
    const desc = (transaction.description ?? "").toLowerCase();
    const term = searchTerm.toLowerCase();

  const matchesSearch =
    desc.includes(term) ||
    catLabel.toLowerCase().includes(term);

    // Period filter (inclusive)
    let matchesPeriod = true;
    if (startDate || endDate) {
      const txDate = new Date(transaction.date);
      if (isNaN(txDate.getTime())) {
        matchesPeriod = false;
      } else {
        if (startDate) {
          const s = new Date(startDate);
          // start of day
          s.setHours(0, 0, 0, 0);
          if (txDate.getTime() < s.getTime()) matchesPeriod = false;
        }
        if (endDate) {
          const e = new Date(endDate);
          // end of day
          e.setHours(23, 59, 59, 999);
          if (txDate.getTime() > e.getTime()) matchesPeriod = false;
        }
      }
    }

    return matchesFilter && matchesSearch && matchesPeriod;
  });

  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Extrato</h1>
        <p className="text-muted-foreground">Acompanhe todas as suas transações</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 dark:text-green-300 mb-1">Receitas</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                  R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300 mb-1">Despesas</p>
                <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                  R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-200 dark:bg-red-800 rounded-full flex items-center justify-center">
                <ArrowDownRight className="h-6 w-6 text-red-700 dark:text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Saldo</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filter} onValueChange={(value: string) => setFilter(value as "all" | "income" | "expense")}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de transação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Popover open={periodOpen} onOpenChange={setPeriodOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    Período
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-auto">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label htmlFor="start-date">Data início</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="end-date">Data fim</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                          setPeriodOpen(false);
                        }}
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>
      

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.map((transaction) => {
          const dateObj = new Date(transaction.date);
          const formattedDate = isNaN(dateObj.getTime())
            ? "-"
            : dateObj.toLocaleDateString("pt-BR");
          const categoryLabel = getCategoryLabel(transaction);

          return (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === "income"
                          ? "bg-green-100 dark:bg-green-900"
                          : "bg-red-100 dark:bg-red-900"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <ArrowDownRight className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-foreground">{transaction.description}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{categoryLabel}</span>
                        <span>•</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <p
                      className={`text-lg font-bold ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"} R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>

                    <>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => {
                          setTxToDelete(transaction);
                          setConfirmOpen(true);
                        }}
                        disabled={deletingId === transaction.id}
                        aria-label="Excluir transação"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir transação?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {txToDelete ? (
                                <>
                                  Você tem certeza que deseja excluir "{txToDelete.description}" no valor de R$ {txToDelete.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}? Esta ação não pode ser desfeita.
                                </>
                              ) : (
                                "Deseja realmente excluir esta transação?"
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setTxToDelete(null)}>
                              Cancelar
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                if (!txToDelete) return;
                                try {
                                  setDeletingId(txToDelete.id);
                                  await deleteTransaction(txToDelete.id);
                                } catch (e) {
                                  // erro tratado no contexto
                                } finally {
                                  setDeletingId(null);
                                  setTxToDelete(null);
                                  setConfirmOpen(false);
                                }
                              }}
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredTransactions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Transactions;
