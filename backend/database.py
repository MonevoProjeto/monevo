from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, date, timedelta
import os
from dotenv import load_dotenv



# Carregar variáveis de ambiente (.env local)
load_dotenv()

# Detectando o ambiente
def get_database_url():
    """Retorna URL do banco baseado no ambiente"""
    
    # Se está no Azure (produção)
    if os.getenv("WEBSITE_INSTANCE_ID"):
        return os.getenv("DATABASE_URL",
            "mssql+pyodbc://monevoadmin:Monevo%402024@monevo-sql-server.database.windows.net/monevo?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes"
        )
    
    # Se DATABASE_URL está definida (configuração manual)
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    
    # Desenvolvimento local (SQLite)
    return "sqlite:///./monevo_local.db"


DATABASE_URL = get_database_url()
print(f"Usando banco: {DATABASE_URL.split('@')[0]}@***" if '@' in DATABASE_URL else DATABASE_URL)

# Configuração do SQLAlchemy
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class MetaTable(Base):
    __tablename__ = "metas"
    
    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String(120), nullable=False)
    descricao = Column(String(255), nullable=True)
    categoria = Column(String(40), nullable=False, index=True)
    valor_objetivo = Column(Float, nullable=False)
    valor_atual = Column(Float, nullable=False, default=0)
    prazo = Column(Date, nullable=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)


def create_tables():
    """Cria as tabelas no banco de dados"""
    try:
        Base.metadata.create_all(bind=engine)
        print("Tabelas criadas com sucesso!")
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")


def get_db():
    """Dependency para sessões do FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def populate_initial_data():
    """Popula dados iniciais apenas no ambiente local"""
    if not DATABASE_URL.startswith("sqlite"):
        return
    
    db = SessionLocal()
    try:
        # Verificar se já tem dados
        count = db.query(MetaTable).count()
        if count > 0:
            print(f"Banco já possui {count} metas")
            return
        
        # Dados iniciais para desenvolvimento
        metas_iniciais = [
            MetaTable(
                titulo="Viagem para Europa",
                descricao="Juntar para férias de julho",
                categoria="Viagem",
                valor_objetivo=15000.00,
                valor_atual=2000.00,
                prazo=date(2025, 7, 15)
            ),
            MetaTable(
                titulo="Quitar fatura do cartão",
                descricao="Zerar dívidas do cartão",
                categoria="Quitar Dívida",
                valor_objetivo=3000.00,
                valor_atual=500.00,
                prazo=date(2024, 12, 20)
            ),
            MetaTable(
                titulo="Reserva de Emergência",
                descricao="6 meses de despesas",
                categoria="Reserva",
                valor_objetivo=8000.00,
                valor_atual=1200.00,
                prazo=date(2025, 6, 30)
            ),
            MetaTable(
                titulo="Entrada da Casa",
                descricao="Juntar para entrada de imóvel",
                categoria="Casa/Imóvel",
                valor_objetivo=50000.00,
                valor_atual=3000.00,
                prazo=date(2026, 12, 31)
            ),
            MetaTable(
                titulo="Comprar carro",
                descricao="Usado, econômico",
                categoria="Veículo",
                valor_objetivo=40000.00,
                valor_atual=2500.00,
                prazo=date(2025, 12, 31)
            ),
            MetaTable(
                titulo="Pós-graduação",
                descricao="Especialização em 2026",
                categoria="Educação",
                valor_objetivo=12000.00,
                valor_atual=1000.00,
                prazo=date(2026, 3, 31)
            )
        ]
        
        db.add_all(metas_iniciais)
        db.commit()
        print("Dados iniciais criados!")
        
    except Exception as e:
        print(f"Erro ao popular dados: {e}")
    finally:
        db.close()


# Carregar variáveis de ambiente (.env local)
load_dotenv()

# Detectando o ambiente
def get_database_url():
    """Retorna URL do banco baseado no ambiente"""
    
    # Se está no Azure (produção)
    if os.getenv("WEBSITE_INSTANCE_ID"):
        return os.getenv("DATABASE_URL",
            "mssql+pyodbc://monevoadmin:Monevo%402024@monevo-sql-server.database.windows.net/monevo?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes"
        )
    
    # Se DATABASE_URL está definida (configuração manual)
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    
    # Desenvolvimento local (SQLite)
    return "sqlite:///./monevo_local.db"


DATABASE_URL = get_database_url()
print(f"Usando banco: {DATABASE_URL.split('@')[0]}@*" if '@' in DATABASE_URL else DATABASE_URL)

# Configuração do SQLAlchemy
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Conta(Base):
    __tablename__ = "contas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=False, index=True)  # ajuste para FK real se existir tabela usuarios
    tipo = Column(String(30), nullable=False)  # 'banco' | 'cartao' | 'carteira'
    nome = Column(String(120), nullable=False)
    fechamento_cartao_dia = Column(Integer, nullable=True)  # só para cartões
    vencimento_cartao_dia = Column(Integer, nullable=True)
    saldo_cache = Column(Float, nullable=True, default=0.0)
    criado_em = Column(DateTime, default=datetime.utcnow)

    transacoes = relationship("Transacao", back_populates="conta", cascade="all, delete-orphan")

class Recorrencia(Base):
    __tablename__ = "recorrencias"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=False, index=True)
    nome = Column(String(120), nullable=False)
    tipo = Column(String(16), nullable=False)  # 'receita' | 'despesa'
    periodicidade = Column(String(32), nullable=True)  # 'mensal', 'semanal'
    dia_base = Column(Integer, nullable=True)
    valor = Column(Float, nullable=True)
    conta_id = Column(Integer, nullable=True)
    alocacao_percentual = Column(Float, nullable=True)  # percentual padrão para metas
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(20), nullable=False)   # 'receita'|'despesa'|'investimento'
    chave = Column(String(50), nullable=False, unique=True)  # slug / machine key, ex: 'salario'
    nome = Column(String(120), nullable=False)   # nome exibido: 'Salário'
    icone = Column(String(64), nullable=True)    # opcional: string com nome do ícone
    ordem = Column(Integer, default=0)           # ordenação na UI
    ativo = Column(Boolean, default=True)
    parent_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    parent = relationship("Categoria", remote_side=[id], backref="children")

    def _repr_(self):
        return f"<Categoria {self.tipo}:{self.chave}>"


# Tabela principal: Transacoes
class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=False, index=True)  # ajuste para FK real se houver tabela usuarios
    data = Column(DateTime, nullable=False, default=datetime.utcnow)
    valor = Column(Float, nullable=False)  # sempre positivo; usar 'tipo' para definir receita/despesa
    tipo = Column(String(20), nullable=False)  # 'despesa' | 'receita' | 'transferencia' | 'investimento'

    # Categoria: referência à tabela categorias
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    categoria = relationship("Categoria", lazy="joined")
    categoria_cache = Column(String(120), nullable=True)  # texto redundante para listagens rápidas

    descricao = Column(Text, nullable=True)

    # Conta / cartão
    conta_id = Column(Integer, ForeignKey("contas.id"), nullable=True)
    cartao_id = Column(Integer, nullable=True)  # se preferir, transforme em FK para uma tabela de cartoes
    conta = relationship("Conta", back_populates="transacoes")

    # parcelamento
    parcelas_total = Column(Integer, nullable=True)
    parcela_num = Column(Integer, nullable=True)

    # referência externa (import, id do banco, etc.)
    referencia = Column(String(128), nullable=True)
    origem_import = Column(String(32), nullable=True)  # 'manual'|'csv'|'openbanking' etc.

    # associação com meta (se existir)
    meta_id = Column(Integer, nullable=True)  # FK para metas.id se você quiser estabelecer FK
    alocacao_percentual = Column(Float, nullable=True)  # ex: 15.0 => 15%
    alocado_valor = Column(Float, nullable=True)  # valor calculado = valor * percentual / 100

    status = Column(String(32), nullable=False, default="pendente")  # 'pendente'|'conciliado'|'confirmado'

    # ligação com recorrencia (se veio de um template)
    recorrencia_id = Column(Integer, ForeignKey("recorrencias.id"), nullable=True)

    # anexos / comprovante
    comprovante_url = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)


def create_tables():
    """Cria as tabelas no banco de dados"""
    try:
        Base.metadata.create_all(bind=engine)
        print("Tabelas criadas com sucesso!")
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")


def get_db():
    """Dependency para sessões do FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def populate_initial_data():
    """Popula dados iniciais apenas no ambiente local"""
    if not DATABASE_URL.startswith("sqlite"):
        return
    
    db = SessionLocal()
    try:
        # Verificar se já tem dados

        count_cat = db.query(Categoria).count()
        if count_cat > 0:
            print(f"Banco já possui {count_cat} categorias")
            return
        
        # Pais (tipos) — criamos como categorias pai para facilitar ordenação/agrupamento
        receita_parent = Categoria(tipo="receita", chave="receita", nome="Receita", ordem=0)
        despesa_parent = Categoria(tipo="despesa", chave="despesa", nome="Despesa", ordem=0)
        invest_parent = Categoria(tipo="investimento", chave="investimento", nome="Investimento", ordem=0)
        db.add_all([receita_parent, despesa_parent, invest_parent])
        db.flush()  # garantir ids

        categorias_seed = [
            # RECEITAS (filhos do receita_parent)
            {"tipo":"receita","chave":"salario","nome":"Salário","ordem":1, "parent_id": receita_parent.id},
            {"tipo":"receita","chave":"freelance","nome":"Freelance","ordem":2, "parent_id": receita_parent.id},
            {"tipo":"receita","chave":"investimentos","nome":"Investimentos","ordem":3, "parent_id": receita_parent.id},
            {"tipo":"receita","chave":"vendas","nome":"Vendas","ordem":4, "parent_id": receita_parent.id},
            {"tipo":"receita","chave":"outros_receita","nome":"Outros","ordem":99, "parent_id": receita_parent.id},

            # DESPESAS (filhos do despesa_parent)
            {"tipo":"despesa","chave":"alimentacao","nome":"Alimentação","ordem":1, "parent_id": despesa_parent.id},
            {"tipo":"despesa","chave":"transporte","nome":"Transporte","ordem":2, "parent_id": despesa_parent.id},
            {"tipo":"despesa","chave":"saude","nome":"Saúde","ordem":3, "parent_id": despesa_parent.id},
            {"tipo":"despesa","chave":"educacao","nome":"Educação","ordem":4, "parent_id": despesa_parent.id},
            {"tipo":"despesa","chave":"lazer","nome":"Lazer","ordem":5, "parent_id": despesa_parent.id},
            {"tipo":"despesa","chave":"casa","nome":"Casa","ordem":6, "parent_id": despesa_parent.id},
            {"tipo":"despesa","chave":"compras","nome":"Compras","ordem":7, "parent_id": despesa_parent.id},
            {"tipo":"despesa","chave":"outros_despesa","nome":"Outros","ordem":99, "parent_id": despesa_parent.id},

            # INVESTIMENTOS (filhos do invest_parent)
            {"tipo":"investimento","chave":"renda_fixa","nome":"Renda Fixa","ordem":1, "parent_id": invest_parent.id},
            {"tipo":"investimento","chave":"renda_variavel","nome":"Renda Variável","ordem":2, "parent_id": invest_parent.id},
            {"tipo":"investimento","chave":"fundos","nome":"Fundos","ordem":3, "parent_id": invest_parent.id},
            {"tipo":"investimento","chave":"criptomoedas","nome":"Criptomoedas","ordem":4, "parent_id": invest_parent.id},
            {"tipo":"investimento","chave":"outros_invest","nome":"Outros","ordem":99, "parent_id": invest_parent.id},
        ]

        for c in categorias_seed:
            cat = Categoria(
                tipo=c["tipo"],
                chave=c["chave"],
                nome=c["nome"],
                ordem=c["ordem"],
                parent_id=c.get("parent_id")
            )
            db.add(cat)

        # Criar contas de exemplo só em dev (como antes)
        conta_corrente = Conta(
            usuario_id=1,
            tipo="banco",
            nome="Conta Corrente - Banco Exemplo",
            saldo_cache=1200.50
        )
        cartao = Conta(
            usuario_id=1,
            tipo="cartao",
            nome="Cartão Visa X",
            fechamento_cartao_dia=25,
            vencimento_cartao_dia=10
        )
        db.add_all([conta_corrente, cartao])
        db.flush()

        # Criar algumas transações de exemplo (opcionais)
        transacoes_iniciais = [
            Transacao(
                usuario_id=1,
                data=datetime(2025, 9, 3, 10, 15),
                valor=250.00,
                tipo="despesa",
                categoria_cache="Alimentação",
                conta_id=conta_corrente.id,
                origem_import="manual",
                status="confirmado",
                conta=conta_corrente
            ),
            Transacao(
                usuario_id=1,
                data=datetime(2025, 9, 5, 8, 0),
                valor=3500.00,
                tipo="receita",
                categoria_cache="Salário",
                conta_id=conta_corrente.id,
                origem_import="manual",
                status="confirmado",
                alocacao_percentual=15.0,
                alocado_valor=3500.00 * 15.0 / 100.0,
                conta=conta_corrente
            ),
            Transacao(
                usuario_id=1,
                data=datetime(2025, 9, 10, 12, 0),
                valor=1200.00,
                tipo="despesa",
                categoria_cache="Eletrônicos",
                descricao="Parcelado 3x - Notebook",
                conta_id=cartao.id,
                cartao_id=cartao.id,
                parcelas_total=3,
                parcela_num=1,
                origem_import="manual",
                status="pendente",
                conta=cartao
            )
        ]
        db.add_all(transacoes_iniciais)

        db.commit()
        print("Dados iniciais (categorias, contas, metas, transações) criados!")

        print("Dados iniciais criados!")
        db.add_all(transacoes_iniciais)
        db.commit()
        print("Dados iniciais (contas + transações) criados!")
        
    except Exception as e:
        print(f"Erro ao popular dados: {e}")
    finally:
        db.close()


class UsuarioTable(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    senha = Column(String(255), nullable=False)
