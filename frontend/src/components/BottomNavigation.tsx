
import { Home, Target, Brain, Plus, Bell, User, Receipt } from "lucide-react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const tabs = [
    { id: "dashboard", label: "Início", icon: Home },
    { id: "transactions", label: "Extrato", icon: Receipt },
    { id: "goals", label: "Metas", icon: Target },
    { id: "ai", label: "IA", icon: Brain },
    { id: "notifications", label: "Alertas", icon: Bell },
    { id: "profile", label: "Perfil", icon: User },
  ];

  return (
    <>
      {/* Floating Add Button */}
      <button
        onClick={() => onTabChange("add")}
        className="fixed bottom-20 right-4 w-14 h-14 bg-gradient-to-r from-monevo-blue to-monevo-lightBlue text-white rounded-full shadow-lg flex items-center justify-center z-20 hover:scale-105 transition-transform duration-200"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-10">
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${
                  isActive 
                    ? "text-monevo-blue bg-blue-50" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <IconComponent className={`h-5 w-5 ${isActive ? "text-monevo-blue" : ""}`} />
                <span className={`text-xs font-medium ${isActive ? "text-monevo-blue" : ""}`}>
                  {tab.label}
                </span>
                {tab.id === "notifications" && (
                  <div className="absolute top-2 right-6 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default BottomNavigation;
