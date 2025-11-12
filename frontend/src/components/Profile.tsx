import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Mail,
  
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

const Profile = () => {
  const { currentUser, logout } = useApp();
  const user = {
    name: currentUser?.nome ?? 'Usuário',
    email: currentUser?.email ?? '—',
    phone: '',
    memberSince: currentUser?.data_criacao ? new Date(currentUser.data_criacao).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—',
    avatar: ''
  };

  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  const handleEditProfile = () => {
    navigate('/onboarding', { state: { edit: true } });
  };

  const menuItems = [
    {
      icon: User,
      title: "Editar Perfil",
      description: "Altere suas informações pessoais",
      action: handleEditProfile
    },
    {
      icon: HelpCircle,
      title: "Ajuda e Suporte",
      description: "Precisa de ajuda? Estamos aqui",
      action: () => setShowHelp(true)
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
              {user.name ? user.name.split(' ')[0].charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
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
          
          {/* Phone removed by request */}
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

      {/* Help / FAQ panel (rendered when user opens Ajuda e Suporte) */}
      {showHelp && (
        <Card>
          <CardHeader>
            <CardTitle className="text-monevo-blue">Ajuda e Suporte — FAQ</CardTitle>
            <CardDescription>Perguntas frequentes e informações de contato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <details className="p-3 bg-gray-50 rounded">
                <summary className="font-medium">Como criar uma meta?</summary>
                <p className="text-sm text-gray-600 mt-2">Vá para a aba Metas e clique em "Adicionar Meta". Preencha título, objetivo e prazo, e salve.</p>
              </details>

              <details className="p-3 bg-gray-50 rounded">
                <summary className="font-medium">Como editar meu perfil?</summary>
                <p className="text-sm text-gray-600 mt-2">Acesse Perfil → Editar Perfil e atualize suas informações. Lembre-se de salvar no final do onboarding.</p>
              </details>

              <details className="p-3 bg-gray-50 rounded">
                <summary className="font-medium">Minhas transações somem após logout — o que fazer?</summary>
                <p className="text-sm text-gray-600 mt-2">As transações são salvas vinculadas ao seu usuário. Verifique se você está logado com o mesmo email e se o token não expirou. Se necessário, entre em contato com suporte.</p>
              </details>
            </div>

            <div className="p-4 bg-gray-100 rounded">
              <p className="font-medium">Contato</p>
              <p className="text-sm text-gray-600 mt-2">Para dúvidas, envie um email para:</p>
              <p className="mt-2 font-mono text-sm text-monevo-blue">suporte@monevo.example</p>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" onClick={() => setShowHelp(false)}>Fechar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* App Info */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center space-y-2">
            <h3 className="font-bold text-monevo-blue text-lg">Monevo</h3>
            <p className="text-sm text-gray-500">Versão 2.0.0</p>
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
        onClick={() => { try { logout(); } catch (e) { console.warn('logout failed', e); } }}
      >
        <LogOut className="h-5 w-5 mr-2" />
        Sair do Aplicativo
      </Button>
    </div>
  );
};

export default Profile;
