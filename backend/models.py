from pydantic import BaseModel, Field, ConfigDict, EmailStr, validator
from datetime import date, datetime
from typing import Optional, List


# --- Constantes do Domínio ---
CATEGORIAS_METAS = [
    "Viagem",
    "Quitar Dívida",
    "Reserva",
    "Casa/Imóvel",
    "Veículo",
    "Educação",
]

CATEGORIA_TIPOS = ["receita", "despesa", "investimento"]

# Subcategorias conforme front — chave (slug) e nome exibido
CATEGORIAS_HIERARQUIA = {
    "receita": [
        {"chave": "salario", "nome": "Salário"},
        {"chave": "freelance", "nome": "Freelance"},
        {"chave": "investimentos", "nome": "Investimentos"},
        {"chave": "vendas", "nome": "Vendas"},
        {"chave": "outros_receita", "nome": "Outros"},
    ],
    "despesa": [
        {"chave": "alimentacao", "nome": "Alimentação"},
        {"chave": "transporte", "nome": "Transporte"},
        {"chave": "saude", "nome": "Saúde"},
        {"chave": "educacao", "nome": "Educação"},
        {"chave": "lazer", "nome": "Lazer"},
        {"chave": "casa", "nome": "Casa"},
        {"chave": "compras", "nome": "Compras"},
        {"chave": "outros_despesa", "nome": "Outros"},
    ],
    "investimento": [
        {"chave": "renda_fixa", "nome": "Renda Fixa"},
        {"chave": "renda_variavel", "nome": "Renda Variável"},
        {"chave": "fundos", "nome": "Fundos"},
        {"chave": "criptomoedas", "nome": "Criptomoedas"},
        {"chave": "outros_invest", "nome": "Outros"},
    ],
}


# -------------------------
# Meta (Pydantic schemas)
# -------------------------
class Meta(BaseModel):
    """Schema de Retorno (Read)"""
    id: Optional[int] = None
    titulo: str
    categoria: str 
    descricao: Optional[str] = None
    valor_objetivo: float
    valor_atual: float
    prazo: Optional[date] = None
    data_criacao: Optional[datetime] = None

    # Configuração Pydantic V2 para ORM
    model_config = ConfigDict(from_attributes=True)


class MetaCreate(BaseModel):
    """Schema de Criação (Create)"""
    titulo: str = Field(..., min_length=3, max_length=120, description="Título da meta financeira") 
    descricao: Optional[str] = Field(None, max_length=255, description="Descrição detalhada da meta")
    categoria: str = Field(..., description="Escolha uma das categorias do wireframe")
    valor_objetivo: float = Field(..., gt=0, le=1_000_000, description="Valor total que se deseja atingir")
    valor_atual: float = Field(..., ge=0, le=1_000_000, description="Progresso atual da meta")
    prazo: Optional[date] = Field(None, description="Data limite para atingir a meta (opcional)")

class MetaUpdate(BaseModel):
    """Schema de Atualização (Update)"""
    titulo: Optional[str] = Field(None, min_length=3, max_length=120)
    descricao: Optional[str] = Field(None, max_length=255)
    categoria: Optional[str] = None
    valor_objetivo: Optional[float] = Field(None, gt=0, le=1_000_000)
    valor_atual: Optional[float] = Field(None, ge=0, le=1_000_000)
    prazo: Optional[date] = None


# -------------------------
# Categoria (Pydantic schemas)
# -------------------------
class CategoriaBase(BaseModel):
    tipo: str = Field(..., description="Tipo: 'receita' | 'despesa' | 'investimento'")
    chave: str = Field(..., min_length=1, max_length=50, description="Chave única (slug), ex: 'salario'")
    nome: str = Field(..., min_length=1, max_length=120, description="Nome exibido da categoria")
    ordem: Optional[int] = Field(0, ge=0, description="Ordem de exibição")
    parent_id: Optional[int] = None

    @validator("tipo")
    def validar_tipo(cls, v):
        if v not in CATEGORIA_TIPOS:
            raise ValueError(f"tipo inválido, deve ser um de: {CATEGORIA_TIPOS}")
        return v


class CategoriaCreate(CategoriaBase):
    pass


class CategoriaRead(CategoriaBase):
    """Schema de Retorno (Read)"""
    id: int

    # Configuração Pydantic V2 para ORM (Refatorado)
    model_config = ConfigDict(from_attributes=True)


class CategoriaUpdate(BaseModel):
    """Schema de Atualização (Update)"""
    nome: Optional[str] = Field(None, max_length=120)
    ordem: Optional[int] = Field(None, ge=0)
    ativo: Optional[bool] = None
    parent_id: Optional[int] = None


# -------------------------
# Conta (Pydantic schemas)
# -------------------------
class ContaBase(BaseModel):
    usuario_id: Optional[int] = None
    tipo: str = Field(..., description="Tipo: 'banco' | 'cartao' | 'carteira'")
    nome: str = Field(..., min_length=1, max_length=120)
    fechamento_cartao_dia: Optional[int] = Field(None, ge=1, le=31)
    vencimento_cartao_dia: Optional[int] = Field(None, ge=1, le=31)


class ContaCreate(ContaBase):
    pass


class ContaRead(ContaBase):
    """Schema de Retorno (Read)"""
    id: int
    saldo_cache: Optional[float] = 0.0
    criado_em: Optional[datetime] = None

    # Configuração Pydantic V2 para ORM (Refatorado)
    model_config = ConfigDict(from_attributes=True)


class ContaUpdate(BaseModel):
    """Schema de Atualização (Update)"""
    nome: Optional[str] = Field(None, max_length=120)
    fechamento_cartao_dia: Optional[int] = Field(None, ge=1, le=31)
    vencimento_cartao_dia: Optional[int] = Field(None, ge=1, le=31)


# -------------------------
# Recorrencia (Pydantic schemas)
# -------------------------
class RecorrenciaBase(BaseModel):
    usuario_id: Optional[int] = None
    nome: str = Field(..., min_length=1, max_length=120)
    tipo: str = Field(..., description="'receita'|'despesa'")
    periodicidade: Optional[str] = Field(None, description="'mensal'|'semanal'|'anual'")
    dia_base: Optional[int] = Field(None, ge=1, le=31)
    valor: Optional[float] = Field(None, ge=0)
    conta_id: Optional[int] = None
    alocacao_percentual: Optional[float] = Field(None, ge=0, le=100)
    ativo: Optional[bool] = True


class RecorrenciaCreate(RecorrenciaBase):
    pass


class RecorrenciaRead(RecorrenciaBase):
    """Schema de Retorno (Read)"""
    id: int
    criado_em: Optional[datetime] = None

    # Configuração Pydantic V2 para ORM (Refatorado)
    model_config = ConfigDict(from_attributes=True)


class RecorrenciaUpdate(BaseModel):
    """Schema de Atualização (Update)"""
    nome: Optional[str] = Field(None, max_length=120)
    periodicidade: Optional[str] = None
    dia_base: Optional[int] = Field(None, ge=1, le=31)
    valor: Optional[float] = Field(None, ge=0)
    conta_id: Optional[int] = None
    alocacao_percentual: Optional[float] = Field(None, ge=0, le=100)
    ativo: Optional[bool] = None


# -------------------------
# Transacao (Pydantic schemas)
# -------------------------
class TransacaoBase(BaseModel):
    usuario_id: Optional[int] = None
    data: Optional[datetime] = None
    valor: float = Field(..., gt=0, description="Valor sempre positivo; tipo define despesa/receita")
    tipo: str = Field(..., description="'despesa'|'receita'|'transferencia'|'investimento'")
    conta_id: Optional[int] = None
    cartao_id: Optional[int] = None
    categoria_id: Optional[int] = None
    categoria: Optional[str] = None
    descricao: Optional[str] = Field(None, max_length=255)
    parcelas_total: Optional[int] = Field(None, ge=1)
    parcela_num: Optional[int] = Field(None, ge=1)
    referencia: Optional[str] = None
    origem_import: Optional[str] = "manual"
    meta_id: Optional[int] = None
    alocacao_percentual: Optional[float] = Field(None, ge=0, le=100)
    status: Optional[str] = Field("pendente", description="'pendente'|'confirmado'|'conciliado'|'recusado'")

    @validator("tipo")
    def validar_tipo_transacao(cls, v):
        allowed = ["despesa", "receita", "transferencia", "investimento"]
        if v not in allowed:
            raise ValueError(f"tipo inválido, use um de: {allowed}")
        return v


class TransacaoCreate(TransacaoBase):
    pass


class TransacaoRead(TransacaoBase):
    """Schema de Retorno (Read)"""
    id: int
    alocado_valor: Optional[float] = 0.0
    categoria_cache: Optional[str] = None
    conta_nome_cache: Optional[str] = None
    meta_nome_cache: Optional[str] = None
    created_at: Optional[datetime] = None

    # Configuração Pydantic V2 para ORM (Refatorado)
    model_config = ConfigDict(from_attributes=True)


class TransacaoUpdate(BaseModel):
    """Schema de Atualização (Update)"""
    data: Optional[datetime] = None
    valor: Optional[float] = Field(None, gt=0)
    tipo: Optional[str] = None
    conta_id: Optional[int] = None
    cartao_id: Optional[int] = None
    categoria_id: Optional[int] = None
    categoria: Optional[str] = None
    descricao: Optional[str] = None
    parcelas_total: Optional[int] = Field(None, ge=1)
    parcela_num: Optional[int] = Field(None, ge=1)
    referencia: Optional[str] = None
    origem_import: Optional[str] = None
    meta_id: Optional[int] = None
    alocacao_percentual: Optional[float] = Field(None, ge=0, le=100)
    status: Optional[str] = None


# -------------------------
# Fatura (somente leitura / resumo)
# -------------------------
class FaturaRead(BaseModel):
    """Schema de Retorno (Read)"""
    conta_cartao_id: int
    periodo_inicio: date
    periodo_fim: date
    total: float
    count: int

    # Configuração Pydantic V2 para ORM (Refatorado)
    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Usuário (Pydantic schemas)
# -------------------------
class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    email: EmailStr


class UsuarioCreate(UsuarioBase):
    """Dados para criar nova conta (entrada: POST /auth/registro)"""
    senha: str = Field(..., min_length=6, description="Senha do usuário (será criptografada)")


class Usuario(UsuarioBase):
    """Representação pública do usuário (saída: GET /auth/me)"""
    id: int
    data_criacao: Optional[datetime] = None

    # Configuração Pydantic V2 para ORM
    model_config = ConfigDict(from_attributes=True)

# -------------------------
# Autenticação (schemas adicionais)
# -------------------------
class UsuarioLogin(BaseModel):
    """Dados para login (entrada: POST /auth/login)"""
    email: EmailStr
    senha: str


class LoginResponse(BaseModel):
    """Retorno do login bem-sucedido (saída: POST /auth/login)"""
    token: str
    usuario: Usuario


# -------------------------
# Onboarding schemas
# -------------------------
class OnboardingGoalCreate(BaseModel):
    """Sub-schema para metas na etapa 3 do Onboarding"""
    nome: str
    valor: str
    meses: Optional[int] = None


class OnboardingStep1(BaseModel):
    """Schema de Entrada/Criação para a Etapa 1"""
    nome: str
    email: EmailStr
    senha: str
    idade: Optional[int] = None
    profissao: Optional[str] = None
    cpf: Optional[str] = None
    estadoCivil: Optional[str] = None


class OnboardingStep2(BaseModel):
    """Schema de Entrada/Criação para a Etapa 2"""
    saldoAtual: Optional[str] = None
    tipoRendaMensal: Optional[str] = None
    valorRendaMensal: Optional[str] = None
    faixaRendaMensal: Optional[str] = None


class OnboardingStep3(BaseModel):
    """Schema de Entrada/Criação para a Etapa 3"""
    rendaMensal: Optional[str] = None
    despesaMensal: Optional[str] = None
    investimentoMensal: Optional[str] = None
    metas: Optional[List[OnboardingGoalCreate]] = []


class OnboardingCreate(BaseModel):
    """Schema Completo de Criação/Submissão do Onboarding (entrada)"""
    step1: Optional[OnboardingStep1] = None
    step2: Optional[OnboardingStep2] = None
    step3: Optional[OnboardingStep3] = None
    step4: Optional[dict] = None  # despesas por categoria


# --- Schemas para leitura/atualização de perfil (sem retornar senha) ---
class OnboardingStep1Read(BaseModel):
    """Schema de Leitura/Retorno para a Etapa 1"""
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    idade: Optional[int] = None
    profissao: Optional[str] = None
    cpf: Optional[str] = None
    estadoCivil: Optional[str] = None


class OnboardingRead(BaseModel):
    """Schema Completo de Leitura/Retorno do Perfil (saída)"""
    step1: Optional[OnboardingStep1Read] = None
    step2: Optional[OnboardingStep2] = None
    step3: Optional[OnboardingStep3] = None
    step4: Optional[dict] = None
    metas: Optional[List[OnboardingGoalCreate]] = []

    # Configuração Pydantic V2 para ORM (Adicionado)
    model_config = ConfigDict(from_attributes=True)


# Modelo para updates (senha opcional para permitir alteração de senha)
class OnboardingStep1Update(BaseModel):
    """Schema de Atualização para a Etapa 1"""
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None # Senha é opcional, se presente, será re-hasheada
    idade: Optional[int] = None
    profissao: Optional[str] = None
    cpf: Optional[str] = None
    estadoCivil: Optional[str] = None


class OnboardingUpdate(BaseModel):
    """Schema Completo de Atualização do Perfil (entrada)"""
    step1: Optional[OnboardingStep1Update] = None
    step2: Optional[OnboardingStep2] = None
    step3: Optional[OnboardingStep3] = None
    step4: Optional[dict] = None