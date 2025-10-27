
import { useState } from "react";
import Dashboard from "@/components/Dashboard";
import Investments from "@/components/Investments";
import AddTransaction from "@/components/AddTransaction";
import Reports from "@/components/Reports";
import Profile from "@/components/Profile";
import Goals from "@/components/Goals";
import AIAssistant from "@/components/AIAssistant";
import Notifications from "@/components/Notifications";
import AddGoal from "@/components/AddGoal";
import ChatWithAI from "@/components/ChatWithAI";
import ViewAnalysis from "@/components/ViewAnalysis";
import SimulateInvestment from "@/components/SimulateInvestment";
import ActivatePlan from "@/components/ActivatePlan";
import ViewDetailsInsight from "@/components/ViewDetailsInsight";
import PayNow from "@/components/PayNow";
import ViewProgress from "@/components/ViewProgress";
import ViewReserve from "@/components/ViewReserve";
import ViewProgressGoal from "@/components/ViewProgressGoal";
import Transactions from "@/components/Transactions";
import BottomNavigation from "@/components/BottomNavigation";
import { AppProvider } from "@/contexts/AppContext";
import type { Goal } from "@/contexts/AppContext";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const isMobile = useIsMobile();

  const renderActiveComponent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onNavigate={setActiveTab} />;
      case "goals":
        return <Goals onNavigate={setActiveTab} onSetEditGoal={setEditingGoal} />;
      case "ai":
        return <AIAssistant onNavigate={setActiveTab} />;
      case "investments":
        return <Investments />;
      case "add":
        return <AddTransaction onClose={() => setActiveTab("dashboard")} />;
      case "reports":
        return <Reports />;
      case "notifications":
        return <Notifications />;
      case "profile":
        return <Profile />;
      case "add-goal":
        return (
          <AddGoal
            onClose={() => { setActiveTab("goals"); setEditingGoal(null); }}
            editGoal={editingGoal}
          />
        );
      case "chat-ai":
        return <ChatWithAI onClose={() => setActiveTab("ai")} />;
      case "view-analysis":
        return <ViewAnalysis onClose={() => setActiveTab("dashboard")} />;
      case "simulate":
        return <SimulateInvestment onClose={() => setActiveTab("dashboard")} />;
      case "activate-plan":
        return <ActivatePlan onClose={() => setActiveTab("ai")} />;
      case "view-details-insight":
        return <ViewDetailsInsight onClose={() => setActiveTab("ai")} />;
      case "pay-now":
        return <PayNow onClose={() => setActiveTab("notifications")} />;
      case "view-progress":
        return <ViewProgress onClose={() => setActiveTab("notifications")} />;
      case "view-reserve":
        return <ViewReserve onClose={() => setActiveTab("notifications")} />;
      case "view-progress-goal":
        return <ViewProgressGoal onClose={() => setActiveTab("ai")} />;
      case "transactions":
        return <Transactions />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <AppProvider>
      {isMobile ? (
        // Mobile Layout
        <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
          {/* Status Bar Simulation */}
          <div className="bg-monevo-blue h-6 w-full"></div>
          
          {/* Main Content */}
          <div className="flex-1 pb-20 overflow-y-auto">
            {renderActiveComponent()}
          </div>

          {/* Bottom Navigation */}
          <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      ) : (
        // Desktop Layout
        <SidebarProvider defaultOpen={true}>
          <div className="min-h-screen w-full flex bg-background">
            <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
            
            <SidebarInset className="flex-1">
              <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-6">
                <SidebarTrigger />
                <div className="flex-1">
                  <h1 className="text-lg font-semibold text-foreground">
                    {activeTab === "dashboard" && "Dashboard"}
                    {activeTab === "goals" && "Metas Financeiras"}
                    {activeTab === "ai" && "Assistente IA"}
                    {activeTab === "notifications" && "Notificações"}
                    {activeTab === "profile" && "Perfil"}
                    {activeTab === "add" && "Nova Transação"}
                    {activeTab === "transactions" && "Extrato"}
                  </h1>
                </div>
              </header>

              <main className="flex-1 overflow-y-auto p-6">
                {renderActiveComponent()}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      )}
    </AppProvider>
  );
};

export default Index;
