
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X, ArrowUpCircle, ArrowDownCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import CategorySelector from "./CategorySelector";
const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";
const DEFAULT_USER_ID = Number(import.meta.env.VITE_DEFAULT_USER_ID ?? 1);

// + novo
const mapTypeToBackend = (t: string) => {
  if (t === "income") return "receita";
  if (t === "expense") return "despesa";
  return "investimento"; // "investment"
};

interface AddTransactionProps {
  onClose: () => void;
}

const AddTransaction = ({ onClose }: AddTransactionProps) => {
  const [type, setType] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const { toast } = useToast();
  const { addTransaction } = useApp();

  const transactionTypes = [
    { value: "income", label: "Receita", icon: ArrowUpCircle, color: "text-green-600" },
    { value: "expense", label: "Despesa", icon: ArrowDownCircle, color: "text-red-600" },
    { value: "investment", label: "Investimento", icon: TrendingUp, color: "text-blue-600" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!type || !amount || !category || !description) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    
  // normaliza "1.234,56" -> 1234.56
  const normalizedAmount = Number(
    String(amount).trim().replace(/\./g, "").replace(",", ".")
  );

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    toast({
      title: "Valor inválido",
      description: "Informe um valor numérico maior que zero.",
      variant: "destructive",
    });
    return;
  }

  // payload compatível com POST /transacoes do FastAPI
  const payload = {
    usuario_id: Number(DEFAULT_USER_ID),            // obrigatório no backend
    data: (date ?? new Date()).toISOString(),       // datetime ISO
    valor: normalizedAmount,                        // number
    tipo: mapTypeToBackend(type),                   // income/expense/investment -> receita/despesa/investimento
    descricao: description || undefined,            // opcional
    categoria: category || undefined,               // string (slug/nome); back resolve para id/cache
    status: "pendente",                             // default
    // conta_id: 1,                                  // (opcional) associe a uma conta
    // meta_id: 3,                                   // (opcional) vincule a uma meta
    // alocacao_percentual: 15,                      // (opcional) % para meta
  };

  try {
    // Use shared app context to add transaction (optimistic update + server sync)
    await addTransaction({
      type: type as 'income' | 'expense' | 'investment',
      category,
      description,
      amount: normalizedAmount,
      date: payload.data,
    });

    // Simular salvamento
    toast({
      title: "Sucesso!",
      description: `${transactionTypes.find(t => t.value === type)?.label} adicionada com sucesso.`,
    });

    onClose();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    toast({
      title: "Falha ao salvar",
      description: message || "Tente novamente.",
      variant: "destructive",
    });
  }
};

  const handleCategoryReset = () => {
    setCategory("");
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-monevo-blue to-monevo-lightBlue rounded-lg p-4 text-white">
        <h1 className="text-xl font-bold">Adicionar Lançamento</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-white/20 p-2"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Transaction Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-monevo-blue">Tipo de Transação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {transactionTypes.map((transactionType) => {
              const IconComponent = transactionType.icon;
              return (
                <button
                  key={transactionType.value}
                  onClick={() => {
                    setType(transactionType.value);
                    handleCategoryReset();
                  }}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    type === transactionType.value
                      ? "border-monevo-blue bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <IconComponent className={`h-6 w-6 mx-auto mb-2 ${
                    type === transactionType.value ? "text-monevo-blue" : transactionType.color
                  }`} />
                  <p className={`text-sm font-medium ${
                    type === transactionType.value ? "text-monevo-blue" : "text-gray-700"
                  }`}>
                    {transactionType.label}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Category Selection */}
      <CategorySelector 
        type={type}
        selectedCategory={category}
        onCategorySelect={setCategory}
      />

      {/* Form */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 text-lg font-medium"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                placeholder="Digite uma descrição"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecionar data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => selectedDate && setDate(selectedDate)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-monevo-blue hover:bg-monevo-darkBlue text-white py-3 text-lg font-medium"
              >
                Adicionar Lançamento
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddTransaction;
