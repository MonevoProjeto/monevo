import { useState } from "react";
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

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
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
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Simulated login - replace with actual Supabase auth
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Mock validation
      if (data.email === "teste@teste.com" && data.password === "123456") {
        toast.success("Login realizado com sucesso!");
        // replace history so back button doesn't return to login
        navigate("/index", { replace: true });
      } else {
        setError("Email ou senha incorretos");
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    setError("");
    
    try {
      // Simulated register - replace with actual Supabase auth
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      toast.success("Cadastro realizado com sucesso! Faça login para continuar.");
      setMode("login");
      loginForm.reset();
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="seu@email.com"
                  {...loginForm.register("email")}
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="button"
                variant="link"
                className="px-0 font-normal"
                onClick={() => setMode("forgot")}
                disabled={isLoading}
              >
                Esqueci minha senha
              </Button>

              {/* Temporário: navegar direto para a página de Index para testes sem validação */}
              <Button
                type="button"
                className="w-full"
                disabled={isLoading}
                onClick={() => navigate("/onboarding", { replace: true })}
              >
                Entrar (teste)
              </Button>

              <div className="text-center text-sm">
                Não tem uma conta?{" "}
                <Button
                  type="button"
                  variant="link"
                  className="px-1"
                  onClick={() => setMode("register")}
                  disabled={isLoading}
                >
                  Criar conta
                </Button>
              </div>
            </form>
          )}

          {mode === "register" && (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
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
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
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