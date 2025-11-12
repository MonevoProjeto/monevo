import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button"; // Corrigido: usando caminho relativo
import { Input } from "../components/ui/input"; // Corrigido: usando caminho relativo
import { Label } from "../components/ui/label"; // Corrigido: usando caminho relativo
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"; // Corrigido: usando caminho relativo
import { Alert, AlertDescription } from "../components/ui/alert"; // Corrigido: usando caminho relativo
import { Loader2, Chrome } from "lucide-react"; 
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { login as apiLogin } from "../services/auth"; // Corrigido: usando caminho relativo
import { useApp } from "../contexts/AppContext"; // Corrigido: usando caminho relativo

/**
 * estados e libs principais:
 * * mode: alterna o formulário exibido.
 * isLoading: controla o botão com spinner (email/senha).
 * isGoogleLoading: controla o botão com spinner (Google).
 * error: mostra um <Alert /> com mensagem de erro.
 * useNavigate(): faz o redirecionamento após login/cadastro.
 * setCurrentUser: grava o usuário no AppContext (fica disponível no app inteiro).
 */

// --- Google Auth Configuration ---
// Endpoint do backend FastAPI para iniciar o fluxo OAuth
const GOOGLE_AUTH_URL = "http://localhost:8000/auth/google";
// --- End Config ---

// define esquemas Zod para validação de formulários
const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(72, "A senha deve ter no máximo 72 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(72, "A senha deve ter no máximo 72 caracteres"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const Auth = () => {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [isLoading, setIsLoading] = useState(false);
  // NOVO: Estado de loading para o Google Login
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); 
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setCurrentUser } = useApp();

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

  // Handler para login com email e senha
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
          if (usuario) {
            setCurrentUser({ 
              id: usuario.id, 
              nome: usuario.nome || usuario.name || '', 
              email: usuario.email, 
              data_criacao: usuario.data_criacao || null 
            });
          }
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


  // Handler para cadastro (salva rascunho e redireciona para onboarding)
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
        localStorage.setItem('monevo_registration', JSON.stringify(draft));
      } catch (e) {
        console.warn('Could not save registration draft to localStorage', e);
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

  // Handler para recuperação de senha (simulado)
  const handleForgotPassword = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Simulated forgot password
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setMode("login");
    } catch (err) {
      setError("Erro ao enviar email. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // NOVO: Handler para login social com Google
  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setError("");
    // Inicia o fluxo OAuth redirecionando para o endpoint do backend
    window.location.href = GOOGLE_AUTH_URL; 
    // O backend fará o resto do trabalho (autenticação Google, geração de JWT e redirecionamento final)
  };

  const renderSocialLoginButtons = () => (
    <>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Ou continue com
          </span>
        </div>
      </div>
      <Button 
        type="button" 
        variant="outline" 
        className="w-full transition duration-300 hover:bg-muted/50" 
        onClick={handleGoogleLogin}
        disabled={isLoading || isGoogleLoading}
      >
        {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Chrome className="mr-2 h-4 w-4" />
          )}
        Google
      </Button>
    </>
  );


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
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              {/* Botões de Social Login */}
              {renderSocialLoginButtons()} 

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Ou entre com email e senha
                  </span>
                </div>
              </div>

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
                <div className="text-right">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm text-primary hover:underline"
                    onClick={() => setMode("forgot")}
                    disabled={isLoading || isGoogleLoading}
                  >
                    Esqueceu a senha?
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
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
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              {/* Botões de Social Login */}
              {renderSocialLoginButtons()} 

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Ou cadastre-se com email e senha
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-name">Nome</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="Seu nome completo"
                  {...registerForm.register("name")}
                  disabled={isLoading || isGoogleLoading}
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
                  disabled={isLoading || isGoogleLoading}
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
                  disabled={isLoading || isGoogleLoading}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
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
                  disabled={isLoading || isGoogleLoading}
                >
                  Fazer login
                </Button>
              </div>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...forgotPasswordForm.register("email")}
                  disabled={isLoading || isGoogleLoading}
                />
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {forgotPasswordForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
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
                  disabled={isLoading || isGoogleLoading}
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
 * - se sucesso, salva token/usuario no localstorage ; atualiza contexto global ; redireciona para /index
 * - se erro, mostra mensagem de erro
 * * no registrar, ele nao cria o usuario agora, so salva o rascunho no localstorage e redireciona para /onboarding
 * onde deve concluir o cadastro 
 * * NOVO: Adicionado botão de Login/Cadastro com Google que redireciona para o endpoint OAuth do backend (http://localhost:8000/auth/google).
 */

// apos login bem sucedido:
// auth.js salva token e usuario no localstorage
// appcontext tenta carregar usuario do localstorage e disponibiliza globalmente
// e o fetchcomauth injeta o token em todas as requisições