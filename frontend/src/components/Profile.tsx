
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Mail,
  Phone
} from "lucide-react";

const Profile = () => {
  const user = {
    name: "João Silva",
    email: "joao.silva@email.com",
    phone: "(11) 99999-9999",
    memberSince: "Janeiro 2024",
    avatar: ""
  };

  const menuItems = [
    {
      icon: User,
      title: "Editar Perfil",
      description: "Altere suas informações pessoais",
      action: () => console.log("Editar perfil")
    },
    {
      icon: Bell,
      title: "Notificações",
      description: "Configure suas preferências de notificação",
      action: () => console.log("Notificações")
    },
    {
      icon: Shield,
      title: "Segurança",
      description: "Senha e configurações de segurança",
      action: () => console.log("Segurança")
    },
    {
      icon: Settings,
      title: "Configurações",
      description: "Personalize o aplicativo",
      action: () => console.log("Configurações")
    },
    {
      icon: HelpCircle,
      title: "Ajuda e Suporte",
      description: "Precisa de ajuda? Estamos aqui",
      action: () => console.log("Ajuda")
    }
  ];

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-monevo-blue to-monevo-lightBlue rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-4">Perfil</h1>
        
        {/* User Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border-2 border-white/20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-white/20 text-white text-lg font-bold">
              {user.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-blue-100 text-sm">Membro desde {user.memberSince}</p>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-monevo-blue">Informações de Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-monevo-blue" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Phone className="h-5 w-5 text-monevo-blue" />
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="font-medium text-gray-900">{user.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-monevo-blue">Configurações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <IconComponent className="h-5 w-5 text-monevo-blue" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <h3 className="font-bold text-monevo-blue text-lg">Monevo</h3>
            <p className="text-sm text-gray-500">Versão 1.0.0</p>
            <p className="text-xs text-gray-400">
              Desenvolvido com ❤️ para sua organização financeira
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logout Button */}
      <Button 
        variant="outline" 
        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 py-3"
        onClick={() => console.log("Logout")}
      >
        <LogOut className="h-5 w-5 mr-2" />
        Sair do Aplicativo
      </Button>
    </div>
  );
};

export default Profile;
