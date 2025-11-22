import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, CheckCircle, Info, Clock } from "lucide-react";
// Importe sua instância de API (ex: axios)
import { listarNotificacoes, marcarNotificacaoLida } from "@/api"; // ou o caminho correto do seu api.js

// Interface baseada no modelo Pydantic
interface Notificacao {
  id: number;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar notificações ao abrir a tela
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await listarNotificacoes();
      setNotifications(data);
    } catch (error) {
      console.error("Erro ao carregar notificações", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      // Atualiza no backend
      await marcarNotificacaoLida(id);
      // Atualiza localmente para refletir a UI instantaneamente
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, lida: true } : n
      ));
    } catch (error) {
      console.error("Erro ao atualizar notificação", error);
    }
  };

  // Função auxiliar para escolher ícone e cor baseado no 'tipo' salvo no banco
  const getStyleByType = (tipo: string) => {
    switch (tipo) {
      case 'orcamento_estourado':
      case 'alerta':
        return { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" };
      case 'sucesso':
        return { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" };
      default: // aviso, info, orcamento_alerta
        return { icon: Info, color: "text-blue-600", bg: "bg-blue-50" };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-white" />
            <div>
              <h1 className="text-2xl font-bold">Notificações</h1>
              <p className="text-orange-100">Seus alertas financeiros</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Carregando...</p>
      ) : notifications.length === 0 ? (
        <p className="text-center text-gray-500">Nenhuma notificação no momento.</p>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const style = getStyleByType(notification.tipo);
            const IconComponent = style.icon;
            
            return (
              <Card key={notification.id} className={`${style.bg} ${notification.lida ? 'opacity-60' : ''} transition-all`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <IconComponent className={`h-5 w-5 ${style.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-medium text-gray-900 text-sm">{notification.titulo}</h3>
                        {!notification.lida && <Badge variant="destructive" className="text-xs">Novo</Badge>}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{notification.mensagem}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                           <Clock className="h-3 w-3" /> {formatDate(notification.created_at)}
                        </span>
                        {!notification.lida && (
                          <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => markAsRead(notification.id)}>
                            Marcar como lida
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;