import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  buscarPerfil,
  salvarPerfil,
  submitOnboarding,
  completeOnboarding,
} from "@/api";
import { useApp } from "@/contexts/AppContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Target,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

/* ============================
 *  Schemas de validação
 * ============================ */

const step1Schema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  age: z.string().min(1, "Idade é obrigatória"),
  profession: z.string().min(2, "Profissão é obrigatória"),
  cpf: z.string().min(14, "CPF inválido"),
  maritalStatus: z.string().min(1, "Estado civil é obrigatório"),
});

const step2Schema = z.object({
  currentBalance: z.string().min(1, "Saldo atual é obrigatório"),
  monthlyIncomeType: z.enum(["value", "range"]),
  monthlyIncomeValue: z.string().optional(),
  monthlyIncomeRange: z.string().optional(),
});

const step3Schema = z.object({
  monthlyRevenue: z.string().min(1, "Receita mensal é obrigatória"),
  monthlyExpense: z.string().min(1, "Despesa mensal é obrigatória"),
  monthlyInvestment: z.string().min(1, "Investimento mensal é obrigatório"),
});

interface Goal {
  name: string;
  value: string;
  months: string;
}

interface OnboardingData {
  step1?: z.infer<typeof step1Schema>;
  step2?: z.infer<typeof step2Schema>;
  step3?: z.infer<typeof step3Schema> & { goals: Goal[] };
  step4?: Record<string, string>;
}

type LocState = { edit?: boolean } | null;

/* ============================
 *  Componente principal
 * ============================ */

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocState;

  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [monthlyIncomeType, setMonthlyIncomeType] =
    useState<"value" | "range">("value");

  const { setCurrentUser, refreshGoals, refreshTransactions } = useApp();

  // Há rascunho de cadastro (fluxo email+senha)?
  const hasRegistrationDraft = (() => {
    try {
      return !!localStorage.getItem("monevo_registration");
    } catch {
      return false;
    }
  })();

  // Já existe token (usuário autenticado – ex: login Google)?
  const hasToken = (() => {
    try {
      return !!localStorage.getItem("token");
    } catch {
      return false;
    }
  })();

  /**
   * Regras:
   * - se vier com state.edit === true → edição (Perfil > Editar Perfil)
   * - senão, se tiver token e NÃO tiver rascunho → edição (caso típico do login Google)
   * - senão → novo usuário (cadastro normal email+senha)
   */
  const isEdit = state?.edit === true || (hasToken && !hasRegistrationDraft);

  // Carregar dados iniciais
  useEffect(() => {
    const carregar = async () => {
      if (isEdit) {
        // Edição: buscar /perfil
        try {
          const profile = await buscarPerfil();
          if (profile) {
            const mapped: OnboardingData = {};

            mapped.step1 = {
              name: profile.step1?.nome || profile.step1?.name || "",
              email: profile.step1?.email || "",
              password: "",
              age: profile.step1?.idade
                ? String(profile.step1.idade)
                : "",
              profession: profile.step1?.profissao || "",
              cpf: profile.step1?.cpf || "",
              maritalStatus: profile.step1?.estadoCivil || "",
            } as z.infer<typeof step1Schema>;

            if (profile.step2) {
              mapped.step2 = {
                currentBalance: profile.step2.saldoAtual || "",
                monthlyIncomeType:
                  profile.step2.tipoRendaMensal || "value",
                monthlyIncomeValue: profile.step2.valorRendaMensal || "",
                monthlyIncomeRange: profile.step2.faixaRendaMensal || "",
              } as z.infer<typeof step2Schema>;
              setMonthlyIncomeType(
                profile.step2.tipoRendaMensal || "value"
              );
            }

            if (profile.step3) {
              const metas: Goal[] = Array.isArray(profile.step3.metas)
                ? profile.step3.metas.map((m: any) => ({
                    name: String(m.nome ?? ""),
                    value: String(m.valor ?? ""),
                    months:
                      m.meses != null ? String(m.meses) : "",
                  }))
                : [];

              mapped.step3 = {
                monthlyRevenue: profile.step3.rendaMensal || "",
                monthlyExpense: profile.step3.despesaMensal || "",
                monthlyInvestment:
                  profile.step3.investimentoMensal || "",
                goals: metas,
              } as z.infer<typeof step3Schema> & { goals: Goal[] };

              setGoals(metas);
            }

            if (profile.step4) mapped.step4 = profile.step4;

            setOnboardingData(mapped);
            localStorage.setItem(
              "monevo_onboarding",
              JSON.stringify(mapped)
            );
          }
        } catch (e) {
          console.warn("Erro ao buscar perfil para edição", e);
        }
        return;
      }

      // Novo onboarding: tentar reaproveitar rascunho de registro
      try {
        const reg = localStorage.getItem("monevo_registration");
        if (reg) {
          const parsed = JSON.parse(reg);
          const mapped: OnboardingData = {};
          mapped.step1 = {
            name: parsed.name || "",
            email: parsed.email || "",
            password: parsed.password || "",
            age: "",
            profession: "",
            cpf: "",
            maritalStatus: "",
          } as z.infer<typeof step1Schema>;
          setOnboardingData(mapped);
          localStorage.setItem(
            "monevo_onboarding",
            JSON.stringify(mapped)
          );
          return;
        }
      } catch (e) {
        console.warn("Falha ao ler rascunho de registro:", e);
      }

      // Nenhum dado: limpar possíveis restos
      localStorage.removeItem("monevo_onboarding");
      setOnboardingData({});
      setGoals([]);
    };

    carregar();
  }, [isEdit, buscarPerfil]);

  // Persistir rascunho no localStorage
  useEffect(() => {
    if (Object.keys(onboardingData).length > 0) {
      localStorage.setItem(
        "monevo_onboarding",
        JSON.stringify(onboardingData)
      );
    }
  }, [onboardingData]);

  const progressPercentage = (currentStep / 4) * 100;

  // Máscaras
  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const amount = parseFloat(numbers) / 100;
    if (Number.isNaN(amount)) return "";
    return amount.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const handleSkip = () => {
    if (currentStep < 4) setCurrentStep((s) => s + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    // Backup local
    localStorage.setItem("monevo_onboarding_completed", "true");
    localStorage.setItem(
      "monevo_user_data",
      JSON.stringify(onboardingData)
    );

    try {
      // Montar payload genérico
      const payload: any = {};

      if (onboardingData.step1) {
        payload.step1 = {
          nome: onboardingData.step1.name,
          email: onboardingData.step1.email,
          senha: onboardingData.step1.password || undefined,
          idade: onboardingData.step1.age
            ? Number(onboardingData.step1.age)
            : undefined,
          profissao: onboardingData.step1.profession,
          cpf: onboardingData.step1.cpf,
          estadoCivil: onboardingData.step1.maritalStatus,
        };
      }

      if (onboardingData.step2) {
        payload.step2 = {
          saldoAtual: onboardingData.step2.currentBalance,
          tipoRendaMensal: onboardingData.step2.monthlyIncomeType,
          valorRendaMensal: onboardingData.step2.monthlyIncomeValue,
          faixaRendaMensal: onboardingData.step2.monthlyIncomeRange,
        };
      }

      if (onboardingData.step3) {
        payload.step3 = {
          rendaMensal: onboardingData.step3.monthlyRevenue,
          despesaMensal: onboardingData.step3.monthlyExpense,
          investimentoMensal: onboardingData.step3.monthlyInvestment,
          metas: (onboardingData.step3.goals || goals || []).map(
            (g) => ({
              nome: g.name,
              valor: g.value,
              meses: g.months ? Number(g.months) : undefined,
            })
          ),
        };
      }

      if (onboardingData.step4) {
        payload.step4 = onboardingData.step4;
      }

      if (isEdit) {
        // Atualizar perfil de usuário existente
        try {
          await salvarPerfil(payload);
          toast.success("Perfil atualizado com sucesso");
          if (refreshGoals) await refreshGoals();
          if (refreshTransactions) await refreshTransactions();
        } catch (e) {
          console.error("Falha ao atualizar perfil:", e);
          toast.error("Falha ao salvar perfil no servidor");
        }
      } else {
        // Novo usuário: criar e logar
        try {
          // Limpar sessão anterior
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
          } catch {
            /* ignore */
          }
          if (setCurrentUser) setCurrentUser(null);

          const res = await submitOnboarding(payload);

          if (res && res.token) {
            localStorage.setItem("token", res.token);
            if (res.usuario) {
              localStorage.setItem(
                "usuario",
                JSON.stringify(res.usuario)
              );
              if (setCurrentUser) {
                setCurrentUser({
                  id: res.usuario.id,
                  nome:
                    res.usuario.nome ||
                    res.usuario.name ||
                    "",
                  email: res.usuario.email,
                  data_criacao:
                    res.usuario.data_criacao || null,
                });
              }
            }

            if (refreshGoals) await refreshGoals();
            if (refreshTransactions) await refreshTransactions();

            try {
              await completeOnboarding();
            } catch (e) {
              console.warn(
                "Falha ao marcar onboarding como completo:",
                e
              );
            }

            try {
              localStorage.removeItem("monevo_registration");
              localStorage.removeItem("monevo_onboarding");
            } catch {
              /* ignore */
            }

            toast.success("Perfil criado e sessão iniciada");
          } else {
            toast.error(
              "Onboarding criado, mas resposta do servidor inesperada"
            );
          }
        } catch (e) {
          console.error("Falha ao submeter onboarding:", e);
          toast.error("Falha ao criar usuário e salvar perfil");
        }
      }
    } catch (e) {
      console.warn("Erro ao tentar persistir perfil", e);
    }

    toast.success("Bem-vindo ao Monevo! 🎉", {
      description: "Seu perfil foi configurado com sucesso.",
    });

    navigate("/index#dashboard", { replace: true });
  };

  const addGoal = () => {
    setGoals((g) => [...g, { name: "", value: "", months: "" }]);
  };

  const updateGoal = (index: number, field: keyof Goal, value: string) => {
    setGoals((prev) =>
      prev.map((g, i) =>
        i === index ? { ...g, [field]: value } : g
      )
    );
  };

  const removeGoal = (index: number) => {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl relative">
        {isEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-muted-foreground"
            onClick={() => navigate("/index#dashboard")}
          >
            Voltar ao Dashboard
          </Button>
        )}

        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-monevo-blue">
              {isEdit ? "Editar Perfil" : "Bem-vindo ao Monevo"}
            </CardTitle>
            {!isEdit && (
              <span className="text-sm text-muted-foreground">
                Etapa {currentStep} de 4
              </span>
            )}
          </div>
          <CardDescription>
            {isEdit
              ? "Altere suas informações pessoais e financeiras."
              : "Configure sua experiência financeira personalizada"}
          </CardDescription>
          {!isEdit && (
            <Progress value={progressPercentage} className="h-2" />
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <Step1
              data={onboardingData.step1}
              onSave={(data) => {
                setOnboardingData((prev) => ({
                  ...prev,
                  step1: data,
                }));
                handleNext();
              }}
              onSkip={handleSkip}
              formatCPF={formatCPF}
            />
          )}

          {currentStep === 2 && (
            <Step2
              data={onboardingData.step2}
              onSave={(data) => {
                setOnboardingData((prev) => ({
                  ...prev,
                  step2: data,
                }));
                handleNext();
              }}
              onBack={handleBack}
              onSkip={handleSkip}
              formatCurrency={formatCurrency}
              monthlyIncomeType={monthlyIncomeType}
              setMonthlyIncomeType={setMonthlyIncomeType}
            />
          )}

          {currentStep === 3 && (
            <Step3
              data={onboardingData.step3}
              goals={goals}
              onSave={(data) => {
                setOnboardingData((prev) => ({
                  ...prev,
                  step3: { ...data, goals },
                }));
                handleNext();
              }}
              onBack={handleBack}
              onSkip={handleSkip}
              formatCurrency={formatCurrency}
              addGoal={addGoal}
              updateGoal={updateGoal}
              removeGoal={removeGoal}
            />
          )}

          {currentStep === 4 && (
            <Step4
              data={onboardingData.step4}
              onSave={(data) => {
                setOnboardingData((prev) => ({
                  ...prev,
                  step4: data,
                }));
                handleFinish();
              }}
              onBack={handleBack}
              onSkip={handleSkip}
              formatCurrency={formatCurrency}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* ============================
 *  Step 1
 * ============================ */

const Step1 = ({
  data,
  onSave,
  onSkip,
  formatCPF,
}: {
  data?: z.infer<typeof step1Schema>;
  onSave: (data: z.infer<typeof step1Schema>) => void;
  onSkip: () => void;
  formatCPF: (value: string) => string;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: data,
  });

  const cpfValue = watch("cpf");

  useEffect(() => {
    if (cpfValue) {
      setValue("cpf", formatCPF(cpfValue));
    }
  }, [cpfValue, setValue, formatCPF]);

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo *</Label>
          <Input id="name" {...register("name")} placeholder="João Silva" />
          {errors.name && (
            <p className="text-sm text-destructive">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="joao@email.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha *</Label>
          <Input
            id="password"
            type="password"
            {...register("password")}
            placeholder="••••••"
          />
          {errors.password && (
            <p className="text-sm text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Idade *</Label>
          <Input
            id="age"
            type="number"
            {...register("age")}
            placeholder="25"
          />
          {errors.age && (
            <p className="text-sm text-destructive">
              {errors.age.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="profession">Profissão/Ocupação *</Label>
          <Input
            id="profession"
            {...register("profession")}
            placeholder="Desenvolvedor"
          />
          {errors.profession && (
            <p className="text-sm text-destructive">
              {errors.profession.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpf">CPF *</Label>
          <Input
            id="cpf"
            {...register("cpf")}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          {errors.cpf && (
            <p className="text-sm text-destructive">
              {errors.cpf.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="maritalStatus">Estado Civil *</Label>
          <Select
            onValueChange={(value) =>
              setValue("maritalStatus", value)
            }
            defaultValue={data?.maritalStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solteiro">Solteiro(a)</SelectItem>
              <SelectItem value="casado">Casado(a)</SelectItem>
              <SelectItem value="divorciado">
                Divorciado(a)
              </SelectItem>
              <SelectItem value="viuvo">Viúvo(a)</SelectItem>
              <SelectItem value="uniao_estavel">
                União Estável
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.maritalStatus && (
            <p className="text-sm text-destructive">
              {errors.maritalStatus.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="ghost" onClick={onSkip}>
          Pular por enquanto
        </Button>
        <Button
          type="submit"
          className="bg-monevo-blue hover:bg-monevo-darkBlue"
        >
          Avançar
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};

/* ============================
 *  Step 2
 * ============================ */

const Step2 = ({
  data,
  onSave,
  onBack,
  onSkip,
  formatCurrency,
  monthlyIncomeType,
  setMonthlyIncomeType,
}: {
  data?: z.infer<typeof step2Schema>;
  onSave: (data: z.infer<typeof step2Schema>) => void;
  onBack: () => void;
  onSkip: () => void;
  formatCurrency: (value: string) => string;
  monthlyIncomeType: "value" | "range";
  setMonthlyIncomeType: (type: "value" | "range") => void;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: data || { monthlyIncomeType: "value" },
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currentBalance">
            Saldo Atual em Conta *
          </Label>
          <Input
            id="currentBalance"
            {...register("currentBalance")}
            placeholder="R$ 0,00"
            onChange={(e) => {
              const formatted = formatCurrency(e.target.value);
              setValue("currentBalance", formatted);
            }}
          />
          {errors.currentBalance && (
            <p className="text-sm text-destructive">
              {errors.currentBalance.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label>Renda Mensal *</Label>
          <div className="flex gap-4 mb-3">
            <Button
              type="button"
              variant={monthlyIncomeType === "value" ? "default" : "outline"}
              onClick={() => {
                setMonthlyIncomeType("value");
                setValue("monthlyIncomeType", "value");
              }}
              className="flex-1"
            >
              Digitar valor
            </Button>
            <Button
              type="button"
              variant={monthlyIncomeType === "range" ? "default" : "outline"}
              onClick={() => {
                setMonthlyIncomeType("range");
                setValue("monthlyIncomeType", "range");
              }}
              className="flex-1"
            >
              Selecionar faixa
            </Button>
          </div>

          {monthlyIncomeType === "value" ? (
            <Input
              {...register("monthlyIncomeValue")}
              placeholder="R$ 0,00"
              onChange={(e) => {
                const formatted = formatCurrency(e.target.value);
                setValue("monthlyIncomeValue", formatted);
              }}
            />
          ) : (
            <Select
              onValueChange={(value) =>
                setValue("monthlyIncomeRange", value)
              }
              defaultValue={data?.monthlyIncomeRange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma faixa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ate_1">
                  Até 1 salário mínimo
                </SelectItem>
                <SelectItem value="1_2">
                  1 a 2 salários mínimos
                </SelectItem>
                <SelectItem value="2_3">
                  2 a 3 salários mínimos
                </SelectItem>
                <SelectItem value="3_5">
                  3 a 5 salários mínimos
                </SelectItem>
                <SelectItem value="5_10">
                  5 a 10 salários mínimos
                </SelectItem>
                <SelectItem value="mais_10">
                  Mais de 10 salários mínimos
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onSkip}>
            Pular
          </Button>
          <Button
            type="submit"
            className="bg-monevo-blue hover:bg-monevo-darkBlue"
          >
            Avançar
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
};

/* ============================
 *  Step 3
 * ============================ */

const Step3 = ({
  data,
  goals,
  onSave,
  onBack,
  onSkip,
  formatCurrency,
  addGoal,
  updateGoal,
  removeGoal,
}: {
  data?: z.infer<typeof step3Schema> & { goals: Goal[] };
  goals: Goal[];
  onSave: (data: z.infer<typeof step3Schema>) => void;
  onBack: () => void;
  onSkip: () => void;
  formatCurrency: (value: string) => string;
  addGoal: () => void;
  updateGoal: (index: number, field: keyof Goal, value: string) => void;
  removeGoal: (index: number) => void;
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof step3Schema>>({
    resolver: zodResolver(step3Schema),
    defaultValues: data,
  });

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthlyRevenue">Receita Mensal *</Label>
          <Input
            id="monthlyRevenue"
            {...register("monthlyRevenue")}
            placeholder="R$ 0,00"
            onChange={(e) => {
              const formatted = formatCurrency(e.target.value);
              setValue("monthlyRevenue", formatted);
            }}
          />
          {errors.monthlyRevenue && (
            <p className="text-sm text-destructive">
              {errors.monthlyRevenue.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyExpense">Despesa Mensal *</Label>
          <Input
            id="monthlyExpense"
            {...register("monthlyExpense")}
            placeholder="R$ 0,00"
            onChange={(e) => {
              const formatted = formatCurrency(e.target.value);
              setValue("monthlyExpense", formatted);
            }}
          />
          {errors.monthlyExpense && (
            <p className="text-sm text-destructive">
              {errors.monthlyExpense.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyInvestment">
            Investimento Mensal *
          </Label>
          <Input
            id="monthlyInvestment"
            {...register("monthlyInvestment")}
            placeholder="R$ 0,00"
            onChange={(e) => {
              const formatted = formatCurrency(e.target.value);
              setValue("monthlyInvestment", formatted);
            }}
          />
          {errors.monthlyInvestment && (
            <p className="text-sm text-destructive">
              {errors.monthlyInvestment.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-monevo-blue" />
            Metas Financeiras
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addGoal}
          >
            Adicionar Meta
          </Button>
        </div>

        {goals.map((goal, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Nome da Meta</Label>
                <Input
                  value={goal.name}
                  onChange={(e) =>
                    updateGoal(index, "name", e.target.value)
                  }
                  placeholder="Ex: Viagem"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  value={goal.value}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    updateGoal(index, "value", formatted);
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              <div className="space-y-2 flex gap-2">
                <div className="flex-1">
                  <Label>Prazo (meses)</Label>
                  <Input
                    type="number"
                    value={goal.months}
                    onChange={(e) =>
                      updateGoal(index, "months", e.target.value)
                    }
                    placeholder="12"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="mt-7"
                  onClick={() => removeGoal(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onSkip}>
            Pular
          </Button>
          <Button
            type="submit"
            className="bg-monevo-blue hover:bg-monevo-darkBlue"
          >
            Avançar
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
};

/* ============================
 *  Step 4
 * ============================ */

const Step4 = ({
  data,
  onSave,
  onBack,
  onSkip,
  formatCurrency,
}: {
  data?: Record<string, string>;
  onSave: (data: Record<string, string>) => void;
  onBack: () => void;
  onSkip: () => void;
  formatCurrency: (value: string) => string;
}) => {
  const [expenses, setExpenses] = useState<Record<string, string>>(
    data || {
      viagem: "",
      lazer: "",
      luz: "",
      agua: "",
      internet: "",
      mercado: "",
      transporte: "",
      aluguel: "",
      saude: "",
      outros: "",
    }
  );

  const categories = [
    { key: "viagem", label: "Viagem" },
    { key: "lazer", label: "Lazer" },
    { key: "luz", label: "Luz" },
    { key: "agua", label: "Água" },
    { key: "internet", label: "Internet" },
    { key: "mercado", label: "Mercado" },
    { key: "transporte", label: "Transporte" },
    { key: "aluguel", label: "Aluguel / Condomínio" },
    { key: "saude", label: "Saúde" },
    { key: "outros", label: "Outros" },
  ];

  const handleExpenseChange = (key: string, value: string) => {
    const formatted = formatCurrency(value);
    setExpenses((prev) => ({ ...prev, [key]: formatted }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(expenses);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label className="text-lg font-semibold">
          Despesas Mensais por Categoria
        </Label>
        <p className="text-sm text-muted-foreground">
          Informe quanto você gasta mensalmente em cada categoria
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => (
            <div key={category.key} className="space-y-2">
              <Label htmlFor={category.key}>{category.label}</Label>
              <Input
                id={category.key}
                value={expenses[category.key]}
                onChange={(e) =>
                  handleExpenseChange(category.key, e.target.value)
                }
                placeholder="R$ 0,00"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onSkip}>
            Pular
          </Button>
          <Button
            type="submit"
            className="bg-monevo-success hover:bg-monevo-success/90"
          >
            Finalizar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
};

export default Onboarding;
