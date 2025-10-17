import { Home, Target, Brain, Bell, User, Plus, ChevronRight, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const mainItems = [
    { id: "dashboard", label: "Início", icon: Home },
    { id: "goals", label: "Metas", icon: Target },
    { id: "ai", label: "Assistente IA", icon: Brain },
    { id: "notifications", label: "Notificações", icon: Bell, hasBadge: true },
    { id: "profile", label: "Perfil", icon: User },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-monevo-blue to-monevo-lightBlue rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg text-foreground">Monevo</h2>
              <p className="text-xs text-muted-foreground">Gestão Financeira</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      isActive={isActive}
                      className="relative"
                      tooltip={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="h-5 w-5" />
                      {!isCollapsed && <span>{item.label}</span>}
                      {item.hasBadge && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Ações Rápidas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <Button
              onClick={() => onTabChange("add")}
              className="w-full bg-gradient-to-r from-monevo-blue to-monevo-lightBlue hover:opacity-90"
            >
              <Plus className="h-5 w-5" />
              {!isCollapsed && <span className="ml-2">Nova Transação</span>}
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          size={isCollapsed ? "icon" : "default"}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
