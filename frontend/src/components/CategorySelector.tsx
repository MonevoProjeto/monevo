
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingCart, 
  Car, 
  Heart, 
  GraduationCap, 
  Gamepad2, 
  Home, 
  MoreHorizontal,
  Utensils,
  Briefcase,
  DollarSign,
  TrendingUp,
  PiggyBank,
  Building,
  Coins
} from "lucide-react";

interface CategorySelectorProps {
  type: string;
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

const CategorySelector = ({ type, selectedCategory, onCategorySelect }: CategorySelectorProps) => {
  const categoryData = {
    expense: [
      { name: "Alimentação", icon: Utensils, color: "text-orange-600" },
      { name: "Transporte", icon: Car, color: "text-blue-600" },
      { name: "Saúde", icon: Heart, color: "text-red-600" },
      { name: "Educação", icon: GraduationCap, color: "text-purple-600" },
      { name: "Lazer", icon: Gamepad2, color: "text-green-600" },
      { name: "Casa", icon: Home, color: "text-yellow-600" },
      { name: "Compras", icon: ShoppingCart, color: "text-pink-600" },
      { name: "Outros", icon: MoreHorizontal, color: "text-gray-600" },
    ],
    income: [
      { name: "Salário", icon: Briefcase, color: "text-blue-600" },
      { name: "Freelance", icon: DollarSign, color: "text-green-600" },
      { name: "Investimentos", icon: TrendingUp, color: "text-purple-600" },
      { name: "Vendas", icon: Coins, color: "text-yellow-600" },
      { name: "Outros", icon: MoreHorizontal, color: "text-gray-600" },
    ],
    investment: [
      { name: "Renda Fixa", icon: PiggyBank, color: "text-blue-600" },
      { name: "Renda Variável", icon: TrendingUp, color: "text-green-600" },
      { name: "Fundos", icon: Building, color: "text-purple-600" },
      { name: "Criptomoedas", icon: Coins, color: "text-orange-600" },
      { name: "Outros", icon: MoreHorizontal, color: "text-gray-600" },
    ],
  };

  const categories = categoryData[type as keyof typeof categoryData] || [];

  if (!type) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-monevo-blue">Categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.name;
            
            return (
              <button
                key={category.name}
                onClick={() => onCategorySelect(category.name)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                  isSelected
                    ? "border-monevo-blue bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <IconComponent 
                  className={`h-6 w-6 ${
                    isSelected ? "text-monevo-blue" : category.color
                  }`} 
                />
                <span className={`text-sm font-medium text-center ${
                  isSelected ? "text-monevo-blue" : "text-gray-700"
                }`}>
                  {category.name}
                </span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategorySelector;
