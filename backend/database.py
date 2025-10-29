from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, date
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# -------------------------
# Ambiente / DATABASE_URL
# -------------------------
'''
load_dotenv()

def get_database_url():
    """Retorna URL do banco baseado no ambiente"""
    # Produção (Azure)
    if os.getenv("WEBSITE_INSTANCE_ID"):
        return os.getenv(
            "DATABASE_URL",
            "mssql+pyodbc://monevoadmin:Monevo123%40@monevo.database.windows.net:1433/monevodatabase?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no"

        )
    # Configuração manual
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    # Desenvolvimento local (SQLite)
    return "sqlite:///./monevo_local.db"

DATABASE_URL = get_database_url()
print(f"Usando banco: {DATABASE_URL.split('@')[0]}@***" if '@' in DATABASE_URL else DATABASE_URL)

# -------------------------
# Engine / Session / Base
# -------------------------
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, echo=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
'''
import os
import re
import urllib.parse
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()


def _build_mssql_odbc_url_from_env() -> str:
    """Monta a URL mssql+pyodbc segura via odbc_connect usando variáveis DB_*."""
    server   = os.getenv("DB_SERVER", "monevo.database.windows.net")
    database = os.getenv("DB_NAME",   "monevodatabase")
    username = os.getenv("DB_USER",   "monevoadmin")                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    

    password = os.getenv("DB_PASS")   # defina no Azure App Settings

    # Driver padrão no App Service Linux mais recente
    driver = "ODBC Driver 18 for SQL Server"

    odbc = (
        f"Driver={{{driver}}};"
        f"Server=tcp:{server},1433;"
        f"Database={database};"
        f"Uid={username};"
        f"Pwd={password};"
        "Encrypt=yes;"
        "TrustServerCertificate=no;"
        "Connection Timeout=30;"
    )

    return f"mssql+pyodbc:///?odbc_connect={urllib.parse.quote_plus(odbc)}"


def get_database_url() -> str:
    """Retorna URL do banco baseado no ambiente."""
    # Produção (Azure) — prefira odbc_connect para evitar parsing errors
    if os.getenv("WEBSITE_INSTANCE_ID"):
        # Se existir DATABASE_URL, ainda permitimos fallback (mas odbc_connect é preferido)
        if os.getenv("DB_SERVER") or os.getenv("DB_PASS") or os.getenv("DB_NAME") or os.getenv("DB_USER"):
            return _build_mssql_odbc_url_from_env()
        if os.getenv("DATABASE_URL"):
            return os.getenv("DATABASE_URL")

        # Fallback seguro (odbc_connect) caso nada esteja setado:
        return _build_mssql_odbc_url_from_env()

    # Ambiente manual (ex.: container/local com SQL Server ou outro)
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")

    # Desenvolvimento local (SQLite)
    return "sqlite:///./monevo_local.db"


def _mask_conn_string(url: str) -> str:
    """Oculta senha em prints, cobrindo tanto URL curto quanto odbc_connect."""
    # Caso odbc_connect
    if "odbc_connect=" in url:
        return "mssql+pyodbc:///?odbc_connect=***"

    # Caso URL curto com user:pass@
    # mssql+pyodbc://user:pass@host:port/db?...
    return re.sub(r"(//[^:]+):([^@]+)@", r"\1:***@", url)


DATABASE_URL = get_database_url()
print("Usando banco:", _mask_conn_string(DATABASE_URL))

# -------------------------
# Engine / Session / Base
# -------------------------
engine_kwargs = {}

# SQLite precisa desse connect_args
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Qualquer outro banco
    engine_kwargs.update(
        dict(
            echo=True,
            pool_pre_ping=True,   # evita conexões zumbis
            pool_recycle=1800,    # recicla conexões a cada 30 min
        )
    )
    # Otimização para pyodbc (SQL Server)
    if DATABASE_URL.startswith("mssql+pyodbc"):
        engine_kwargs["fast_executemany"] = True

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# === Schema alvo no Azure SQL ===
SCHEMA = os.getenv("DB_SCHEMA", "dbo")  # você pode mudar via App Settings se quiser

# Use um MetaData com schema fixo
metadata = MetaData(schema=SCHEMA)
Base = declarative_base(metadata=metadata)

# (Opcional) teste rápido de conexão já no startup:
# try:
#     with engine.connect() as conn:
#         conn.exec_driver_sql("SELECT 1")
#     print("Conexão DB: OK")
# except Exception as e:
#     print("Conexão DB: FAIL ->", repr(e))


# -------------------------
# Modelos (UMA ÚNICA Base)
# -------------------------
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

class Conta(Base):
    __tablename__ = "contas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=False, index=True)
    tipo = Column(String(30), nullable=False)  # 'banco' | 'cartao' | 'carteira'
    nome = Column(String(120), nullable=False)
    fechamento_cartao_dia = Column(Integer, nullable=True)
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
    alocacao_percentual = Column(Float, nullable=True)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(20), nullable=False)   # 'receita'|'despesa'|'investimento'
    chave = Column(String(50), nullable=False, unique=True)
    nome = Column(String(120), nullable=False)
    icone = Column(String(64), nullable=True)
    ordem = Column(Integer, default=0)
    ativo = Column(Boolean, default=True)
    parent_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    parent = relationship("Categoria", remote_side=[id], backref="children")

    def _repr_(self):
        return f"<Categoria {self.tipo}:{self.chave}>"

class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=False, index=True)
    data = Column(DateTime, nullable=False, default=datetime.utcnow)
    valor = Column(Float, nullable=False)  # sempre positivo; usar 'tipo' para definir receita/despesa
    tipo = Column(String(20), nullable=False)  # 'despesa' | 'receita' | 'transferencia' | 'investimento'

    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    categoria_rel = relationship("Categoria", lazy="joined")
    categoria_cache = Column(String(120), nullable=True)

    descricao = Column(Text, nullable=True)

    conta_id = Column(Integer, ForeignKey("contas.id"), nullable=True)
    cartao_id = Column(Integer, nullable=True)
    conta = relationship("Conta", back_populates="transacoes")

    parcelas_total = Column(Integer, nullable=True)
    parcela_num = Column(Integer, nullable=True)

    referencia = Column(String(128), nullable=True)
    origem_import = Column(String(32), nullable=True)  # 'manual'|'csv'|'openbanking' etc.

    meta_id = Column(Integer, nullable=True)
    alocacao_percentual = Column(Float, nullable=True)
    alocado_valor = Column(Float, nullable=True)

    status = Column(String(32), nullable=False, default="pendente")

    recorrencia_id = Column(Integer, ForeignKey("recorrencias.id"), nullable=True)

    comprovante_url = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

class UsuarioTable(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    senha = Column(String(255), nullable=False)

# -------------------------
# Helpers (criar/seed/db)
# -------------------------
from sqlalchemy import inspect

def create_tables():
    """Cria/verifica as tabelas no schema configurado."""
    try:
        print(f"create_tables(): usando schema='{SCHEMA}'")
        # checkfirst=True evita recriar; cria o que faltar
        Base.metadata.create_all(bind=engine, checkfirst=True)

        insp = inspect(engine)
        try:
            print("Tabelas em dbo:", insp.get_table_names(schema="dbo"))
        except Exception as e:
            print("Falha ao listar dbo:", repr(e))
        try:
            print("Tabelas (sem schema explícito):", insp.get_table_names())
        except Exception as e:
            print("Falha ao listar default:", repr(e))

        print("Tabelas criadas/verificadas com sucesso!")
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
    """Popula dados iniciais apenas no ambiente local (SQLite)"""
    if not DATABASE_URL.startswith("sqlite"):
        return

    db = SessionLocal()
    try:
        # --- Metas (se vazio) ---
        count_metas = db.query(MetaTable).count()
        if count_metas == 0:
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
            print("Dados iniciais (metas) criados!")

        # --- Categorias/Contas/Transações (se vazio) ---
        count_cat = db.query(Categoria).count()
        if count_cat == 0:
            # Pais (tipos)
            receita_parent = Categoria(tipo="receita", chave="receita", nome="Receita", ordem=0)
            despesa_parent = Categoria(tipo="despesa", chave="despesa", nome="Despesa", ordem=0)
            invest_parent = Categoria(tipo="investimento", chave="investimento", nome="Investimento", ordem=0)
            db.add_all([receita_parent, despesa_parent, invest_parent])
            db.flush()

            categorias_seed = [
                # RECEITAS
                {"tipo":"receita","chave":"salario","nome":"Salário","ordem":1, "parent_id": receita_parent.id},
                {"tipo":"receita","chave":"freelance","nome":"Freelance","ordem":2, "parent_id": receita_parent.id},
                {"tipo":"receita","chave":"investimentos","nome":"Investimentos","ordem":3, "parent_id": receita_parent.id},
                {"tipo":"receita","chave":"vendas","nome":"Vendas","ordem":4, "parent_id": receita_parent.id},
                {"tipo":"receita","chave":"outros_receita","nome":"Outros","ordem":99, "parent_id": receita_parent.id},
                # DESPESAS
                {"tipo":"despesa","chave":"alimentacao","nome":"Alimentação","ordem":1, "parent_id": despesa_parent.id},
                {"tipo":"despesa","chave":"transporte","nome":"Transporte","ordem":2, "parent_id": despesa_parent.id},
                {"tipo":"despesa","chave":"saude","nome":"Saúde","ordem":3, "parent_id": despesa_parent.id},
                {"tipo":"despesa","chave":"educacao","nome":"Educação","ordem":4, "parent_id": despesa_parent.id},
                {"tipo":"despesa","chave":"lazer","nome":"Lazer","ordem":5, "parent_id": despesa_parent.id},
                {"tipo":"despesa","chave":"casa","nome":"Casa","ordem":6, "parent_id": despesa_parent.id},
                {"tipo":"despesa","chave":"compras","nome":"Compras","ordem":7, "parent_id": despesa_parent.id},
                {"tipo":"despesa","chave":"outros_despesa","nome":"Outros","ordem":99, "parent_id": despesa_parent.id},
                # INVESTIMENTOS
                {"tipo":"investimento","chave":"renda_fixa","nome":"Renda Fixa","ordem":1, "parent_id": invest_parent.id},
                {"tipo":"investimento","chave":"renda_variavel","nome":"Renda Variável","ordem":2, "parent_id": invest_parent.id},
                {"tipo":"investimento","chave":"fundos","nome":"Fundos","ordem":3, "parent_id": invest_parent.id},
                {"tipo":"investimento","chave":"criptomoedas","nome":"Criptomoedas","ordem":4, "parent_id": invest_parent.id},
                {"tipo":"investimento","chave":"outros_invest","nome":"Outros","ordem":99, "parent_id": invest_parent.id},
            ]
            for c in categorias_seed:
                db.add(Categoria(
                    tipo=c["tipo"],
                    chave=c["chave"],
                    nome=c["nome"],
                    ordem=c["ordem"],
                    parent_id=c.get("parent_id")
                ))

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
            print("Dados iniciais (categorias, contas, transações) criados!")

    except Exception as e:
        print(f"Erro ao popular dados: {e}")
    finally:
        db.close()
