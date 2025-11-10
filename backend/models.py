# dicionario de entrada e saida da API
# definimos os schemas pydantic 
# valida JSON que chega (request), padroniza o que sai (response) 

from pydantic import BaseModel, Field, ConfigDict, condecimal, validator,  EmailStr
from datetime import date, datetime
from typing import Optional, List


# categorias do wireframe
CATEGORIAS_METAS = [
    "Viagem",
    "Quitar Dívida",
    "Reserva",
    "Casa/Imóvel",
    "Veículo",
    "Educação",
]

"""
representa a mesma entidade mas em momentos diferentes do ciclo de uso da API 

MetaCreate --> quando o cliente envia dados para criar uma meta --> entrada (POST)
MetaUpdate --> quando o cliente atualiza uma meta existente --> entrada (PATCH)
Meta --> quando a API retorna dados ao cliente --> saída (GET)

separar essas classes garante que o codigo seja mais limpo, seguro e escalavel 
evita que o usuario envie campos indevidos (id, data_criacao) ao criar ou atualizar
simplifica as rotas de CRUD 
"""

# Meta --> usado para retornar dados (contém id e data_criacao)
# quando a API retorna dados ao cliente (saída da API)
# quando envia uma meta para o front; contém campos que o banco preenche automaticamente (id, data_criacao)
class Meta(BaseModel):
    id: Optional[int] = None #vai ser gerado automaticamente pelo banco de dados
    titulo: str
    categoria: str 
    descricao: Optional[str] = None
    valor_objetivo: float
    valor_atual: float
    prazo: Optional[date] = None
    data_criacao: Optional[datetime] = None #vai ser inserida automaticamente quando for criada

    class Config:
        model_config = ConfigDict(from_attributes=True) # permite converter um objeto ORM direto para esse modelo 


# MetaCreate --> criação de novas metas (sem id nem data_criacao)
# quando o cliente inputa os dados para criar uma meta (POST)
# valida os dados que o usuairo envia 
class MetaCreate(BaseModel):
    #campos obrigatorios com regras de validação
    titulo: str = Field(..., min_length=3, max_length=120, description="Título da meta financeira") 
    descricao: Optional[str] = Field(None, max_length=255, description="Descrição detalhada da meta")
    categoria: str = Field(..., description="Escolha uma das categorias do wireframe")
    valor_objetivo: float = Field(..., gt=0, le=1_000_000, description="Valor total que se deseja atingir")
    valor_atual: float = Field(..., ge=0, le=1_000_000, description="Progresso atual da meta")
    prazo: Optional[date] = Field(None, description="Data limite para atingir a meta (opcional)")

class MetaUpdate(BaseModel):
    # todos os campos sao opicionais pois a mudança nao é necessaria 
    titulo: Optional[str] = Field(None, min_length=3, max_length=120)
    descricao: Optional[str] = Field(None, max_length=255)
    categoria: Optional[str] = None
    valor_objetivo: Optional[float] = Field(None, gt=0, le=1_000_000)
    valor_atual: Optional[float] = Field(None, ge=0, le=1_000_000)
    prazo: Optional[date] = None





from pydantic import BaseModel, Field, condecimal, validator
from datetime import date, datetime
from typing import Optional



# categorias 

CATEGORIAS_METAS = ["Poupança", "Investimento", "Aquisição", "Educação", "Viagem", "Reserva de Emergência", "Outros"]

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
    id: int

    class Config:
        orm_mode = True


class CategoriaUpdate(BaseModel):
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
    id: int
    saldo_cache: Optional[float] = 0.0
    criado_em: Optional[datetime] = None

    class Config:
        orm_mode = True


class ContaUpdate(BaseModel):
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
    id: int
    criado_em: Optional[datetime] = None

    class Config:
        orm_mode = True


class RecorrenciaUpdate(BaseModel):
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
    id: int
    alocado_valor: Optional[float] = 0.0
    categoria_cache: Optional[str] = None
    conta_nome_cache: Optional[str] = None
    meta_nome_cache: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class TransacaoUpdate(BaseModel):
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
    conta_cartao_id: int
    periodo_inicio: date
    periodo_fim: date
    total: float
    count: int

    class Config:
        orm_mode = True


class UsuarioBase(BaseModel):
    nome: str = Field(..., min_length=3, max_length=100)
    email: EmailStr


class UsuarioCreate(UsuarioBase):
    """Dados para criar nova conta (não incluir campos sensíveis no retorno)"""
    senha: str = Field(..., min_length=6, description="Senha do usuário (será criptografada)")


class Usuario(UsuarioBase):
    """Representação pública do usuário (sem senha)"""
    id: int
    data_criacao: Optional[datetime] = None

    
    model_config = ConfigDict(from_attributes=True)

# -------------------------
# Autenticação (schemas adicionais)
# -------------------------
class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str


class LoginResponse(BaseModel):
    token: str
    usuario: Usuario


# -------------------------
# Onboarding schemas
# -------------------------
class OnboardingGoalCreate(BaseModel):
    nome: str
    valor: str
    meses: Optional[int] = None


class OnboardingStep1(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    idade: Optional[int] = None
    profissao: Optional[str] = None
    cpf: Optional[str] = None
    estadoCivil: Optional[str] = None


class OnboardingStep2(BaseModel):
    saldoAtual: Optional[str] = None
    tipoRendaMensal: Optional[str] = None
    valorRendaMensal: Optional[str] = None
    faixaRendaMensal: Optional[str] = None


class OnboardingStep3(BaseModel):
    rendaMensal: Optional[str] = None
    despesaMensal: Optional[str] = None
    investimentoMensal: Optional[str] = None
    metas: Optional[List[OnboardingGoalCreate]] = []


class OnboardingCreate(BaseModel):
    step1: Optional[OnboardingStep1] = None
    step2: Optional[OnboardingStep2] = None
    step3: Optional[OnboardingStep3] = None
    step4: Optional[dict] = None  # despesas por categoria


# --- Schemas para leitura/atualização de perfil (sem retornar senha) ---
class OnboardingStep1Read(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    idade: Optional[int] = None
    profissao: Optional[str] = None
    cpf: Optional[str] = None
    estadoCivil: Optional[str] = None


class OnboardingRead(BaseModel):
    step1: Optional[OnboardingStep1Read] = None
    step2: Optional[OnboardingStep2] = None
    step3: Optional[OnboardingStep3] = None
    step4: Optional[dict] = None
    metas: Optional[List[OnboardingGoalCreate]] = []


# Modelo para updates (senha opcional para permitir alteração de senha)
class OnboardingStep1Update(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = None
    idade: Optional[int] = None
    profissao: Optional[str] = None
    cpf: Optional[str] = None
    estadoCivil: Optional[str] = None


class OnboardingUpdate(BaseModel):
    step1: Optional[OnboardingStep1Update] = None
    step2: Optional[OnboardingStep2] = None
    step3: Optional[OnboardingStep3] = None
    step4: Optional[dict] = None


"""
Cada entidade (ex.: Meta, Conta, Categoria, Transação, Usuário) tem 3 tipos de schema Pydantic:

Tipo de schema	Função principal	                                            Usado em	                       Campos
Base	        Define os campos comuns da entidade (tipo, nome, valor, etc.)	 Base para herança interna	 Pode ter validações ou Field()
Create	        Dados que o usuário envia para criar um novo registro	         POST	                     Herda do Base (sem id)
Read	        Dados que a API retorna (com id, data_criacao, caches, etc.)	 GET, POST (retorno)	     Inclui campos automáticos e orm_mode/from_attributes
Update	        Dados que o usuário envia para atualizar um registro existente	 PATCH, PUT	                 Todos opcionais (Optional[...])

"""