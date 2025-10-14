from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
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
                titulo="Economizar para intercâmbio",
                descricao="Juntar dinheiro para o intercâmbio em 2025",
                valor_objetivo=15000.00,
                valor_atual=2000.00,
                prazo=datetime(2025, 12, 31)
            ),
            MetaTable(
                titulo="Fundo de emergência",
                descricao="Criar uma reserva financeira para imprevistos",
                valor_objetivo=8000.00,
                valor_atual=1000.00,
                prazo=datetime(2025, 6, 30)
            ),
            MetaTable(
                titulo="Comprar novo notebook",
                descricao="Guardar dinheiro para trocar de computador até o final do ano",
                valor_objetivo=6000.00,
                valor_atual=1200.00,
                prazo=datetime(2024, 12, 31)
            )
        ]
        
        db.add_all(metas_iniciais)
        db.commit()
        print("Dados iniciais criados!")
        
    except Exception as e:
        print(f"Erro ao popular dados: {e}")
    finally:
        db.close()
