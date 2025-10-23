from pydantic import BaseModel, Field, ConfigDict, condecimal, validator,  EmailStr
from datetime import date, datetime
from typing import Optional


# categorias do wireframe
CATEGORIAS_METAS = [
    "Viagem",
    "Quitar Dívida",
    "Reserva",
    "Casa/Imóvel",
    "Veículo",
    "Educação",
]

# Meta --> usado para retornar dados (contém id e data_criacao)
# quando a API retorna dados ao cliente (saída da API)
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
        model_config = ConfigDict(from_attributes=True)


# MetaCreate --> criação de novas metas (sem id nem data_criacao)
# quando o cliente inputa os dados para criar uma meta (POST)
class MetaCreate(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=120, description="Título da meta financeira")
    descricao: Optional[str] = Field(None, max_length=255, description="Descrição detalhada da meta")
    categoria: str = Field(..., description="Escolha uma das categorias do wireframe")
    valor_objetivo: float = Field(..., gt=0, le=1_000_000, description="Valor total que se deseja atingir")
    valor_atual: float = Field(..., ge=0, le=1_000_000, description="Progresso atual da meta")
    prazo: Optional[date] = Field(None, description="Data limite para atingir a meta (opcional)")

class MetaUpdate(BaseModel):
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
    usuario_id: int
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
    usuario_id: int
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
    usuario_id: int
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
    senha: str = Field(..., min_length=6, description="Senha do usuário (será criptografada)")


class Usuario(UsuarioBase):
    id: int

    class Config:
        orm_mode = True
