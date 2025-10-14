from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

# Meta --> usado para retornar dados (contém id e data_criacao)
# quando a API retorna dados ao cliente (saída da API)
class Meta(BaseModel):
    id: Optional[int] = None #vai ser gerado automaticamente pelo banco de dados
    titulo: str
    descricao: Optional[str] = None
    valor_objetivo: float
    valor_atual: float
    prazo: Optional[date] = None
    data_criacao: Optional[datetime] = None #vai ser inserida automaticamente quando for criada

    class Config:
        orm_mode = True  # Permite conversão automática de objetos SQLAlchemy para Pydantic


# MetaCreate --> criação de novas metas (sem id nem data_criacao)
# quando o cliente inputa os dados para criar uma meta (POST)
class MetaCreate(BaseModel):
    titulo: str = Field(..., min_length=3, max_length=120, description="Título da meta financeira")
    descricao: Optional[str] = Field(None, max_length=255, description="Descrição detalhada da meta")
    valor_objetivo: float = Field(..., gt=0, le=1_000_000, description="Valor total que se deseja atingir")
    valor_atual: float = Field(..., ge=0, le=1_000_000, description="Progresso atual da meta")
    prazo: Optional[date] = Field(None, description="Data limite para atingir a meta (opcional)")

class MetaUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=3, max_length=120)
    descricao: Optional[str] = Field(None, max_length=255)
    valor_objetivo: Optional[float] = Field(None, gt=0, le=1_000_000)
    valor_atual: Optional[float] = Field(None, ge=0, le=1_000_000)
    prazo: Optional[date] = None


# categorias 

CATEGORIAS_METAS = ["Poupança", "Investimento", "Aquisição", "Educação", "Viagem", "Reserva de Emergência", "Outros"]
