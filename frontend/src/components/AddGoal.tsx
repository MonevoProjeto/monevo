import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import { 
  ArrowLeft,
  Target, 
  Plane, 
  CreditCard, 
  PiggyBank, 
  Home,
  Car,
  GraduationCap,
  DollarSign,
  Lightbulb
} from "lucide-react";

interface AddGoalProps {
  onClose: () => void;
}

const AddGoal = ({ onClose }: AddGoalProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [goalTitle, setGoalTitle] = useState<string>("");
  const [goalAmount, setGoalAmount] = useState<string>("");
  const [goalDeadline, setGoalDeadline] = useState<string>("");
  const [currentAmount, setCurrentAmount] = useState<string>("");
  
  const { addGoal } = useApp();
  const { toast } = useToast();

  const categories = [
    { id: "travel", label: "Viagem", icon: Plane, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" },
    { id: "debt", label: "Quitar Dívida", icon: CreditCard, color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" },
    { id: "emergency", label: "Reserva", icon: PiggyBank, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" },
    { id: "house", label: "Casa/Imóvel", icon: Home, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200" },
    { id: "car", label: "Veículo", icon: Car, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200" },
    { id: "education", label: "Educação", icon: GraduationCap, color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
    if (!selectedCategoryData) return;

    try {
      const newGoal = {
        title: goalTitle,
        description: `Meta de ${selectedCategoryData.label.toLowerCase()}`,
        target: parseFloat(goalAmount),
        current: parseFloat(currentAmount) || 0,
        deadline: goalDeadline,
        category: selectedCategoryData.label,
        icon: selectedCategoryData.icon.name,
        color: selectedCategoryData.color,
        bgColor: selectedCategoryData.bgColor,
        borderColor: selectedCategoryData.borderColor
      };

      await addGoal(newGoal);
      
      toast({
        title: "Meta criada com sucesso!",
        description: `A meta "${goalTitle}" foi adicionada às suas metas.`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Erro ao criar meta",
        description: "Não foi possível criar a meta. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onClose}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nova Meta</h1>
          <p className="text-gray-600">Defina seu próximo objetivo financeiro</p>
        </div>
      </div>

      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-monevo-blue" />
            Categoria da Meta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isSelected 
                      ? `${category.bgColor} border-current ${category.color}` 
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <IconComponent className={`h-6 w-6 mx-auto mb-2 ${
                    isSelected ? category.color : "text-gray-500"
                  }`} />
                  <p className={`text-sm font-medium ${
                    isSelected ? category.color : "text-gray-700"
                  }`}>
                    {category.label}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Goal Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-monevo-blue" />
            Detalhes da Meta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Nome da Meta</Label>
              <Input
                id="title"
                type="text"
                placeholder="Ex: Viagem para Europa"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Valor da Meta (R$)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="15000"
                value={goalAmount}
                onChange={(e) => setGoalAmount(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="current">Valor Atual (R$)</Label>
              <Input
                id="current"
                type="number"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="deadline">Data Limite</Label>
              <Input
                id="deadline"
                type="date"
                value={goalDeadline}
                onChange={(e) => setGoalDeadline(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-monevo-blue hover:bg-monevo-darkBlue"
              disabled={!selectedCategory || !goalTitle || !goalAmount || !goalDeadline}
            >
              Criar Meta
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* AI Suggestion */}
      {selectedCategoryData && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Lightbulb className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-purple-900 mb-1">💡 Dica da IA Monevo</h4>
                <p className="text-sm text-purple-800">
                  {selectedCategory === "travel" && "Para viagens, considere automatizar uma transferência mensal e usar cashback de cartões."}
                  {selectedCategory === "debt" && "Priorize quitar dívidas com juros altos primeiro - economize muito dinheiro!"}
                  {selectedCategory === "emergency" && "Ideal ter 6 meses de gastos guardados. Comece com meta menor se necessário."}
                  {selectedCategory === "house" && "Para imóveis, considere investir em CDB ou Tesouro Direto para render mais."}
                  {selectedCategory === "car" && "Avalie se vale mais a pena comprar usado ou financiar novo baseado na sua situação."}
                  {selectedCategory === "education" && "Investimento em educação sempre traz retorno. Considere cursos online para economizar."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddGoal;