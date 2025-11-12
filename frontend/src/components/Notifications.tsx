import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  CreditCard,
  Target,
  Shield,
  Smartphone,
  Mail,
  Settings,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";

interface NotificationsProps {
  onNavigate?: (tab: string) => void;
}

const Notifications = ({ onNavigate }: NotificationsProps) => {
  const [activeTab, setActiveTab] = useState<string>("recent");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const recentNotifications = [
    {
      id: "1",
      type: "alert",
      icon: AlertTriangle,
      title: "Orçamento de Alimentação Estourado",
      description: "Você já gastou R$ 650 dos R$ 500 planejados este mês",
      time: "Há 2 horas",
      priority: "high",
      color: "text-red-600",
      bgColor: "bg-red-50",
      action: "Ver detalhes"
    },
    {
      id: "2",
      type: "opportunity",
      icon: TrendingUp,
      title: "Oportunidade de Investimento",
      description: "CDB com 12.5% a.a. disponível - R$ 180/mês a mais de renda",
      time: "Há 4 horas",
      priority: "medium",
      color: "text-green-600",
      bgColor: "bg-green-50",
      action: "Simular"
    },
    {
      id: "3",
      type: "reminder",
      icon: Calendar,
      title: "Vencimento Cartão Amanhã",
      description: "Fatura do cartão vence amanhã: R$ 1.240,50",
      time: "Há 6 horas",
      priority: "high",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      action: "Pagar agora"
    },
    {
      id: "4",
      type: "goal",
      icon: Target,
      title: "Meta de Viagem: 70% Concluída!",
      description: "Faltam apenas R$ 4.500 para sua viagem dos sonhos",
      time: "Ontem",
      priority: "low",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      action: "Ver progresso"
    },
    {
      id: "5",
      type: "success",
      icon: CheckCircle,
      title: "Reserva de Emergência Atualizada",
      description: "Parabéns! Você depositou R$ 800 na reserva este mês",
      time: "2 dias atrás",
      priority: "low",
      color: "text-green-600",
      bgColor: "bg-green-50",
      action: "Ver reserva"
    }
  ];

  const smartAlerts = [
    {
      id: "1",
      title: "Gastos Anômalos",
      description: "Detectar gastos 50% acima da média mensal",
      enabled: true,
      category: "Prevenção"
    },
    {
      id: "2",
      title: "Metas em Risco",
      description: "Alertar quando meta estiver fora do cronograma",
      enabled: true,
      category: "Metas"
    },
    {
      id: "3",
      title: "Oportunidades de Economia",
      description: "Sugerir quando encontrar formas de economizar",
      enabled: true,
      category: "Economia"
    },
    {
      id: "4",
      title: "Vencimentos Importantes",
      description: "Lembrar de faturas e pagamentos 3 dias antes",
      enabled: true,
      category: "Pagamentos"
    },
    {
      id: "5",
      title: "Conquistas e Marcos",
      description: "Celebrar quando você atinge objetivos",
      enabled: true,
      category: "Motivação"
    }
  ];

  const formatTime = (time: string) => {
    return time;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Urgente</Badge>;
      case 'medium':
        return <Badge variant="default" className="text-xs">Importante</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Info</Badge>;
    }
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Notificações</h1>
              <p className="text-orange-100">Alertas inteligentes do Monevo</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center">
              <span className="text-sm font-bold">3</span>
            </div>
            <p className="text-xs text-orange-100 mt-1">Não lidas</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <Smartphone className="h-5 w-5 text-orange-200" />
          <span className="text-sm text-orange-100 flex-1">Notificações ativas</span>
          <Switch 
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
            className="data-[state=checked]:bg-white/30"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("recent")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "recent"
              ? "bg-white text-monevo-blue shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Clock className="h-4 w-4" />
          Recentes
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === "settings"
              ? "bg-white text-monevo-blue shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Settings className="h-4 w-4" />
          Configurações
        </button>
      </div>

      {/* Recent Notifications */}
      {activeTab === "recent" && (
        <div className="space-y-4">
          {recentNotifications.map((notification) => {
            const IconComponent = notification.icon;
            return (
              <Card key={notification.id} className={`${notification.bgColor} hover:shadow-md transition-shadow`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <IconComponent className={`h-5 w-5 ${notification.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{notification.title}</h3>
                        {getPriorityBadge(notification.priority)}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{formatTime(notification.time)}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-7"
                          onClick={() => {
                            if (notification.action === "Ver detalhes") {
                              onNavigate?.("view-analysis");
                            } else if (notification.action === "Simular") {
                              onNavigate?.("simulate");
                            } else if (notification.action === "Pagar agora") {
                              onNavigate?.("pay-now");
                            } else if (notification.action === "Ver progresso") {
                              onNavigate?.("view-progress");
                            } else if (notification.action === "Ver reserva") {
                              onNavigate?.("view-reserve");
                            }
                          }}
                        >
                          {notification.action}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Settings */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-monevo-blue flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Alertas Inteligentes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {smartAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{alert.title}</h4>
                    <p className="text-xs text-gray-600">{alert.description}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {alert.category}
                    </Badge>
                  </div>
                  <Switch 
                    checked={alert.enabled}
                    onCheckedChange={() => {}}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notification Channels */}
          <Card>
            <CardHeader>
              <CardTitle className="text-monevo-blue flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Canais de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Push Notifications</h4>
                    <p className="text-xs text-gray-600">Receber alertas no celular</p>
                  </div>
                </div>
                <Switch checked={true} />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">Email</h4>
                    <p className="text-xs text-gray-600">Resumo semanal por email</p>
                  </div>
                </div>
                <Switch checked={false} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Notifications;
