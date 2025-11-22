import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { login as apiLogin } from "@/services/auth";
import { useApp } from "@/contexts/AppContext";

/**
 * estados e libs principais:
 * 
 * mode: alterna o formulário exibido.
 * isLoading: controla o botão com spinner.
 * error: mostra um <Alert /> com mensagem de erro.
 * useNavigate(): faz o redirecionamento após login/cadastro.
 * setCurrentUser: grava o usuário no AppContext (fica disponível no app inteiro).
 */

// define esquemas Zod para validação de formulários
// passa como resolver para cada form 
//garante mensagens de erro antes de chamar o back 
const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z
    .string()
    .min(6, "A senha deve ter no mínimo 6 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z
    .string()
    .min(6, "A senha deve ter no mínimo 6 caracteres")
    .max(72, "A senha deve ter no máximo 72 caracteres"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

// URL do backend para iniciar o fluxo de login com Google
const GOOGLE_AUTH_URL = (() => {
  try {
    const meta = import.meta as unknown as { env?: { VITE_API_URL?: string } };
    const base = meta.env?.VITE_API_URL || "http://localhost:8000";
    const url = `${base.replace(/\/$/, "")}/auth/google/login`;
    console.log("[AUTH] GOOGLE_AUTH_URL =", url);
    return url;
  } catch (e) {
    console.warn(
      "Falha ao ler import.meta.env, usando fallback para GOOGLE_AUTH_URL",
      e
    );
    return "http://localhost:8000/auth/google/login";
  }
})();

const Auth = () => {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setCurrentUser } = useApp();

  // Garantir favicon ao entrar na rota /auth (corrige casos onde o SPA perdeu a referência)
  useEffect(() => {
    try {
      const setLink = (rel, attrs) => {
        let el = document.querySelector(`link[rel='${rel}']`);
        if (!el) {
          el = document.createElement("link");
          el.rel = rel;
          document.head.appendChild(el);
        }
        Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v as string));
      };

      setLink("icon", {
        href: "/favicon.png",
        type: "image/png",
        sizes: "32x32",
      });
      setLink("shortcut icon", { href: "/favicon.png" });
      setLink("apple-touch-icon", { href: "/favicon.png", sizes: "180x180" });
      // mask-icon for Safari pinned tabs
      setLink("mask-icon", { href: "/placeholder.svg", color: "#4285f4" });
      // theme color
      let meta = document.querySelector("meta[name='theme-color']");
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "theme-color");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", "#ffffff");
    } catch (e) {
      // não quebrar a página por problemas com DOM
      console.warn("Falha ao atualizar favicon dinamicamente:", e);
    }
  }, []);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  //apilogin do serviço fz POST
  //backend valide email e senha (bcrypt), gera JWT e retorna dados
  //token é guardado no localstorage pelo serviço e depois usado nas chamadas protegidas 
  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setError("");

    try {
      const res = await apiLogin(data.email, data.password);
      if (res.sucesso) {
        toast.success("Login realizado com sucesso!");
        // armazenamento já feito pelo serviço (localStorage)
        try {
          const usuario = res.dados?.usuario;
          if (usuario)
            setCurrentUser({
              id: usuario.id,
              nome: usuario.nome || usuario.name || "",
              email: usuario.email,
              data_criacao: usuario.data_criacao || null,
            });
        } catch (e) {
          // ignore
        }
        navigate("/index", { replace: true });
      } else {
        setError(res.erro || "Email ou senha incorretos");
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // login social com Google → redireciona para o backend
  const handleGoogleLogin = () => {
    setError("");
    setIsGoogleLoading(true);
    try {
      window.location.href = GOOGLE_AUTH_URL;
    } catch (err) {
      setIsGoogleLoading(false);
      toast.error("Não foi possível iniciar o login com Google.");
    }
  };

  //aqui nao chamamos POST
  //a ideia é no onboarding usar esse rascunho para criar o usuario completo
  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    setError("");

    try {
      // Save registration draft locally and redirect to onboarding
      const draft = {
        name: data.name,
        email: data.email,
        password: data.password,
        created_at: new Date().toISOString(),
      };
      try {
        localStorage.setItem("monevo_registration", JSON.stringify(draft));
      } catch (e) {
        console.warn("Could not save registration draft to localStorage", e);
      }
      toast.success("Cadastro salvo. Vamos configurar seu perfil.");
      navigate("/onboarding", { replace: true });
      registerForm.reset();
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  //nao vamos colocar isso 
  const handleForgotPassword = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError("");

    try {
      // Simulated forgot password - replace with actual Supabase auth
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setMode("login");
    } catch (err) {
      setError("Erro ao enviar email. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Bem-vindo ao Monevo
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "login" && "Entre com sua conta para continuar"}
            {mode === "register" && "Crie sua conta para começar"}
            {mode === "forgot" && "Recupere o acesso à sua conta"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mode === "login" && (
            <form
              onSubmit={loginForm.handleSubmit(handleLogin)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...loginForm.register("email")}
                  disabled={isLoading || isGoogleLoading}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••"
                  {...loginForm.register("password")}
                  maxLength={72}
                  disabled={isLoading || isGoogleLoading}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              {/* Separador + botão Google */}
              <div className="flex items-center gap-2 my-2">
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground uppercase">
                  ou
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecionando para o Google...
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 533.5 544.3"
                      className="mr-3 h-4 w-4"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="#4285F4"
                        d="M533.5 278.4c0-17.4-1.6-34.1-4.6-50.3H272v95.2h146.9c-6.3 34-25 62.8-53.3 82.1v68.1h86.1c50.3-46.4 80.8-114.7 80.8-195.1z"
                      />
                      <path
                        fill="#34A853"
                        d="M272 544.3c72.6 0 133.6-24.1 178.2-65.5l-86.1-68.1c-23.9 16-54.5 25.4-92.1 25.4-70.7 0-130.6-47.8-152.1-112.1H33.9v70.7C79.1 497 169.6 544.3 272 544.3z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M119.9 321.9c-10.8-32-10.8-66.9 0-98.9V152.3H33.9c-42.7 83.7-42.7 183.1 0 266.8l86-68.2z"
                      />
                      <path
                        fill="#EA4335"
                        d="M272 107.7c39.4 0 74.9 13.6 102.8 40.5l77.1-77.1C405.1 24.4 344.1 0 272 0 169.6 0 79.1 47.3 33.9 119.9l86 68.2C141.4 155.5 201.3 107.7 272 107.7z"
                      />
                    </svg>
                    Entrar com Google
                  </>
                )}
              </Button>

              <div className="text-center text-sm">
                Não tem uma conta?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-1"
                  onClick={() => setMode("register")}
                  disabled={isLoading || isGoogleLoading}
                >
                  Criar conta
                </Button>
              </div>
            </form>
          )}

          {mode === "register" && (
            <form
              onSubmit={registerForm.handleSubmit(handleRegister)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="register-name">Nome</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Seu nome completo"
                  {...registerForm.register("name")}
                  disabled={isLoading}
                />
                {registerForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {registerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...registerForm.register("email")}
                  disabled={isLoading}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Senha</Label>
                <Input
                  id="register-password"
                  type="password"
                  placeholder="••••••"
                  {...registerForm.register("password")}
                  maxLength={72}
                  disabled={isLoading}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  "Criar conta"
                )}
              </Button>

              <div className="text-center text-sm">
                Já tem uma conta?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-1"
                  onClick={() => setMode("login")}
                  disabled={isLoading}
                >
                  Fazer login
                </Button>
              </div>
            </form>
          )}

          {mode === "forgot" && (
            <form
              onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...forgotPasswordForm.register("email")}
                  disabled={isLoading}
                />
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {forgotPasswordForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar email de recuperação"
                )}
              </Button>

              <div className="text-center text-sm">
                Lembrou sua senha?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-1"
                  onClick={() => setMode("login")}
                  disabled={isLoading}
                >
                  Fazer login
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

/**
 * renderiza uma unica pagina com 3 modos: login, cadastro 
 * valida os formularios com zod + react-hook-form
 * chama o servico de api para fazer login
 *     - se sucesso, salva token/usuario no localstorage ; atualiza contexto global ; redireciona para /index
 *     - se erro, mostra mensagem de erro
 * 
 * no registrar, ele nao cria o usuario agora, so salva o rascunho no localstorage e redireciona para /onboarding
 * onde deve concluir o cadastro 
 */

// apos login bem sucedido:
// auth.js salva token e usuario no localstorage
// appcontext tenta carregar usuario do localstorage e disponibiliza globalmente
// e o fetchcomauth injeta o token em todas as requisições
