import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { toast } from "sonner";
import { BASE_URL } from "@/api";

const API_URL = BASE_URL;  

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setCurrentUser, refreshGoals, refreshTransactions } = useApp();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const error = urlParams.get("error");

    if (error) {
      console.error("Erro retornado no callback:", error);
      toast.error("Falha na autenticação com o Google.");
      navigate("/auth", { replace: true });
      return;
    }

    if (!token) {
      toast.error("Não foi possível autenticar com o Google.");
      navigate("/auth", { replace: true });
      return;
    }

    // salvar token localmente
    try {
      localStorage.setItem("token", token);
    } catch (err) {
      console.error("Erro ao salvar o token", err);
    }

    const loadUser = async () => {
      try {
        // 1) Buscar dados básicos do usuário
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          console.error("/auth/me respondeu:", res.status, text);
          throw new Error("Falha ao carregar perfil");
        }

        const dados = await res.json();

        const usuario = {
          id: dados.id,
          nome: dados.nome || dados.name || "",
          email: dados.email,
          data_criacao: dados.data_criacao || null,
        };

        try {
          localStorage.setItem("usuario", JSON.stringify(usuario));
        } catch (err) {
          console.error("Erro ao salvar usuario no localStorage", err);
        }

        if (typeof setCurrentUser === "function") {
          setCurrentUser(usuario);
        }

        // 2) Verificar se o usuário já tem perfil de onboarding
        let jaTemOnboarding = false;
        try {
          const resPerfil = await fetch(`${API_URL}/perfil`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (resPerfil.ok) {
            const perfil = await resPerfil.json();
            if (perfil?.step1 && (perfil.step1.nome || perfil.step1.email)) {
              jaTemOnboarding = true;
            }
          } else {
            // 404/422 etc → tratamos como "não tem onboarding ainda"
            console.log("Perfil ainda não existe ou não encontrado:", resPerfil.status);
          }
        } catch (e) {
          console.warn("Erro ao verificar perfil de onboarding, assumindo que não existe:", e);
        }

        // 3) Carregar dados do app (metas/transações)
        if (typeof refreshGoals === "function") {
          await refreshGoals();
        }
        if (typeof refreshTransactions === "function") {
          await refreshTransactions();
        }

        // 4) Decidir para onde mandar
        if (jaTemOnboarding) {
          toast.success("Login realizado com Google!");
          navigate("/index#dashboard", { replace: true });
        } else {
          toast.success("Conta criada! Vamos configurar seu perfil.");
          navigate("/onboarding", { replace: true });
        }
      } catch (err) {
        console.error("Erro em AuthCallback.loadUser:", err);
        toast.error("Erro ao recuperar informações da conta.");
        try {
          localStorage.removeItem("token");
          localStorage.removeItem("usuario");
        } catch (e) {
          console.error("Falha ao limpar localStorage após erro de autenticação:", e);
        }
        navigate("/auth", { replace: true });
      }
    };

    loadUser();
  }, [navigate, setCurrentUser, refreshGoals, refreshTransactions]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Autenticando...</p>
    </div>
  );
};

export default AuthCallback;
