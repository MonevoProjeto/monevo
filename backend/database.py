from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session
from datetime import datetime, date
import os
import re
import urllib.parse
from dotenv import load_dotenv
from sqlalchemy import inspect
from sqlalchemy.ext.declarative import declarative_base

# --- Import necessário para popular dados (usuário de teste) ---
# Assumindo que auth.py está no mesmo nível
from auth import criar_hash_senha #


# -------------------------
# Ambiente / DATABASE_URL
# -------------------------
load_dotenv()

def get_database_url():
    """Retorna URL do banco baseado no ambiente"""
    # Produção (Azure)
    if os.getenv("WEBSITE_INSTANCE_ID"):
        # A URL de conexão no Azure é complexa. Ajuste os valores conforme seu setup.
        return os.getenv("DATABASE_URL") 
    # Configuração manual
    if os.getenv("DATABASE_URL"):
        return os.getenv("DATABASE_URL")
    # Desenvolvimento local (SQLite)
    return "sqlite:///./monevo_local.db"

DATABASE_URL = get_database_url()
# Mascarar credenciais para logs, se existirem
print(f"Usando banco: {DATABASE_URL.split('@')[0]}@***" if '@' in DATABASE_URL and not DATABASE_URL.startswith("sqlite") else DATABASE_URL)

# -------------------------
# Engine / Session / Base
# -------------------------
# Se não for SQLite, forçamos um schema (útil para SQL Server no Azure)
SCHEMA = "dbo" if not DATABASE_URL.startswith("sqlite") else None

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Configurações otimizadas para SQL Server (Azure)
    engine = create_engine(
        DATABASE_URL, 
        pool_size=20, 
        max_overflow=0, 
        pool_timeout=30, 
        pool_recycle=3600 # Recicla a cada hora
    )

# Cria o Factory de sessão
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base Declarativa (Define o modelo base para todas as tabelas)
Base = declarative_base()


# -------------------------
# Modelos (Tabelas ORM)
# -------------------------

class UsuarioTable(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    # ALTERAÇÃO CRÍTICA: Permite NULL para logins via provedores externos (Google, etc.)
    senha_hash = Column(String(255), nullable=True) 
    # Adicionando a coluna que faltava no modelo
    data_criacao = Column(DateTime, default=datetime.utcnow) 
    onboarding_step = Column(Integer, default=0) # Novo campo para rastrear o onboarding


class MetaTable(Base):
    __tablename__ = "metas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
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
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True) # Corrigido para FK explícita
    tipo = Column(String(30), nullable=False) 
    nome = Column(String(120), nullable=False)
    fechamento_cartao_dia = Column(Integer, nullable=True)
    vencimento_cartao_dia = Column(Integer, nullable=True)
    saldo_cache = Column(Float, nullable=True, default=0.0)
    limite = Column(Float, nullable=True) # Adicionado limite (essencial para cartões)
    criado_em = Column(DateTime, default=datetime.utcnow)

    transacoes = relationship("Transacao", back_populates="conta", cascade="all, delete-orphan")

class Recorrencia(Base):
    __tablename__ = "recorrencias"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True) # Corrigido para FK explícita
    nome = Column(String(120), nullable=False)
    tipo = Column(String(16), nullable=False)
    periodicidade = Column(String(32), nullable=True)
    dia_base = Column(Integer, nullable=True)
    valor = Column(Float, nullable=True)
    conta_id = Column(Integer, ForeignKey("contas.id"), nullable=True) # Corrigido para FK explícita
    alocacao_percentual = Column(Float, nullable=True)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime, default=datetime.utcnow)

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True) # ADICIONADO: FK para o dono da categoria
    tipo = Column(String(20), nullable=False) 
    chave = Column(String(50), nullable=False) # Removido unique=True para permitir que vários usuários usem a mesma chave base
    nome = Column(String(120), nullable=False)
    icone = Column(String(64), nullable=True)
    cor = Column(String(7), nullable=True) # ADICIONADO: cor da categoria (útil no front)
    ordem = Column(Integer, default=0)
    ativo = Column(Boolean, default=True)
    parent_id = Column(Integer, ForeignKey("categorias.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    parent = relationship("Categoria", remote_side=[id], backref="children")

class Transacao(Base):
    __tablename__ = "transacoes"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True) # Corrigido para FK explícita
    data = Column(DateTime, nullable=False, default=datetime.utcnow)
    valor = Column(Float, nullable=False) 
    tipo = Column(String(20), nullable=False) 

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
    origem_import = Column(String(32), nullable=True) 

    meta_id = Column(Integer, ForeignKey("metas.id"), nullable=True) # Corrigido para FK explícita
    alocacao_percentual = Column(Float, nullable=True)
    alocado_valor = Column(Float, nullable=True)

    status = Column(String(32), nullable=False, default="pendente")

    recorrencia_id = Column(Integer, ForeignKey("recorrencias.id"), nullable=True)

    comprovante_url = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)


class OnboardingProfileTable(Base):
    __tablename__ = "onboarding_profiles"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True) 
    usuario = relationship("UsuarioTable", backref="onboarding_profiles")
    idade = Column(Integer, nullable=True)
    profissao = Column(String(120), nullable=True)
    cpf = Column(String(32), nullable=True)
    estado_civil = Column(String(40), nullable=True)
    saldo_atual = Column(String(64), nullable=True) 
    tipo_renda_mensal = Column(String(20), nullable=True)
    valor_renda_mensal = Column(String(64), nullable=True)
    faixa_renda_mensal = Column(String(64), nullable=True)
    renda_mensal = Column(String(64), nullable=True)
    despesa_mensal = Column(String(64), nullable=True)
    investimento_mensal = Column(String(64), nullable=True)
    despesas_json = Column(Text, nullable=True) 
    created_at = Column(DateTime, default=datetime.utcnow)


class OnboardingGoalTable(Base):
    __tablename__ = "onboarding_goals"
    id = Column(Integer, primary_key=True, index=True)
    onboarding_id = Column(Integer, ForeignKey("onboarding_profiles.id"), nullable=False)
    nome = Column(String(200), nullable=False)
    valor = Column(String(64), nullable=True) 
    meses = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# -------------------------
# Helpers (criar/seed/db)
# -------------------------

def create_tables():
    """Cria/verifica as tabelas no schema configurado."""
    try:
        print(f"create_tables(): usando schema='{SCHEMA}'")
        # checkfirst=True evita recriar; cria o que faltar
        Base.metadata.create_all(bind=engine, checkfirst=True)

        insp = inspect(engine)
        try:
            print("Tabelas (default):", insp.get_table_names())
        except Exception as e:
            print("Falha ao listar default:", repr(e))

        # --- Migrações simples (SQLite local) ---
        # Garantir que colunas críticas (adicionadas durante o desenvolvimento) existam
        try:
            if 'usuarios' in insp.get_table_names():
                cols = [c['name'] for c in insp.get_columns('usuarios')]
                
                # Se falta senha_hash
                if 'senha_hash' not in cols:
                    print("Migração: coluna 'senha_hash' ausente — adicionando...")
                    with engine.connect() as conn:
                        conn.exec_driver_sql("ALTER TABLE usuarios ADD COLUMN senha_hash TEXT")
                    print("Migração: coluna 'senha_hash' adicionada.")
                
                # Se falta data_criacao
                if 'data_criacao' not in cols:
                    try:
                        print("Migração: coluna 'data_criacao' ausente — adicionando...")
                        with engine.connect() as conn:
                            conn.exec_driver_sql("ALTER TABLE usuarios ADD COLUMN data_criacao DATETIME DEFAULT (CURRENT_TIMESTAMP)")
                        print("Migração: coluna 'data_criacao' adicionada.")
                    except Exception as e:
                        print("Aviso: falha ao adicionar data_criacao:", repr(e))
                
                # Se falta onboarding_step
                if 'onboarding_step' not in cols:
                    try:
                        print("Migração: coluna 'onboarding_step' ausente — adicionando...")
                        with engine.connect() as conn:
                            conn.exec_driver_sql("ALTER TABLE usuarios ADD COLUMN onboarding_step INTEGER DEFAULT 0")
                        print("Migração: coluna 'onboarding_step' adicionada.")
                    except Exception as e:
                        print("Aviso: falha ao adicionar onboarding_step:", repr(e))

        except Exception as e:
            print("Aviso: falha ao aplicar migrações simples:", repr(e))

        print("Tabelas criadas/verificadas com sucesso!")
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")

def get_db():
    """Dependency para sessões do FastAPI (Garante fechamento)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def populate_initial_data():
    """Popula dados iniciais apenas no ambiente local (SQLite) para desenvolvimento."""
    if not DATABASE_URL.startswith("sqlite"):
        return

    db: Session = SessionLocal()
    try:
        # --- 1. Usuário de Teste (ID=1) ---
        # Se este usuário não existir, ele é o ponto de partida.
        usuario_teste = db.query(UsuarioTable).filter(UsuarioTable.id == 1).first()
        if not usuario_teste:
            print("Criando usuário de teste (id=1)...")
            senha_hash = criar_hash_senha("senha123") # Cria hash da senha usando função de auth.py
            usuario_teste = UsuarioTable(
                id=1,
                email="teste@monevo.com",
                senha_hash=senha_hash,
                nome="Murilo Teste", # Seu nome para o usuário de teste!
                onboarding_step=4, # Marca como Onboarding Completo
                data_criacao=datetime.utcnow()
            )
            db.add(usuario_teste)
            db.commit()
            db.refresh(usuario_teste) # Recarrega para garantir o ID e estado
            print(f"Usuário criado: {usuario_teste.nome} (id={usuario_teste.id})")

        user_id = usuario_teste.id
        
        # --- 2. Metas (se vazio) ---
        if db.query(MetaTable).filter(MetaTable.usuario_id == user_id).count() == 0:
            metas_iniciais = [
                MetaTable(
                    usuario_id=user_id, 
                    titulo="Viagem para Europa",
                    descricao="Juntar para férias de julho",
                    categoria="Viagem",
                    valor_objetivo=15000.00,
                    valor_atual=2000.00,
                    prazo=date(2025, 7, 15)
                ),
                MetaTable(
                    usuario_id=user_id, 
                    titulo="Quitar fatura do cartão",
                    descricao="Zerar dívidas do cartão",
                    categoria="Quitar Dívida",
                    valor_objetivo=3000.00,
                    valor_atual=500.00,
                    prazo=date(2024, 12, 20)
                ),
                MetaTable(
                    usuario_id=user_id, 
                    titulo="Reserva de Emergência",
                    descricao="6 meses de despesas",
                    categoria="Reserva",
                    valor_objetivo=8000.00,
                    valor_atual=1200.00,
                    prazo=date(2025, 6, 30)
                ),
            ]
            db.add_all(metas_iniciais)
            db.commit()
            print("Dados iniciais (metas) criados!")

        # --- 3. Categorias (se vazio) ---
        if db.query(Categoria).filter(Categoria.usuario_id == user_id).count() == 0:
            categorias_iniciais = [
                Categoria(usuario_id=user_id, nome="Salário", tipo="receita", chave="salario", cor="#00A86B"),
                Categoria(usuario_id=user_id, nome="Aluguel/Moradia", tipo="despesa", chave="moradia", cor="#FF6347"),
                Categoria(usuario_id=user_id, nome="Alimentação", tipo="despesa", chave="alimentacao", cor="#FFD700"),
                Categoria(usuario_id=user_id, nome="Investimentos", tipo="investimento", chave="investimento", cor="#4169E1"),
                Categoria(usuario_id=user_id, nome="Educação", tipo="despesa", chave="educacao", cor="#9370DB"),
                Categoria(usuario_id=user_id, nome="Lazer", tipo="despesa", chave="lazer", cor="#3CB371"),
            ]
            db.add_all(categorias_iniciais)
            db.commit()
            print("Dados iniciais (categorias) criados!")
            
            # Recarregar categorias para obter IDs e caches
            cat_salario = db.query(Categoria).filter(Categoria.usuario_id == user_id, Categoria.chave == "salario").first()
            cat_moradia = db.query(Categoria).filter(Categoria.usuario_id == user_id, Categoria.chave == "moradia").first()
            cat_investimento = db.query(Categoria).filter(Categoria.usuario_id == user_id, Categoria.chave == "investimento").first()


        # --- 4. Contas (se vazio) ---
        if db.query(Conta).filter(Conta.usuario_id == user_id).count() == 0:
            conta_corrente = Conta(usuario_id=user_id, nome="Conta Corrente Principal", tipo="Conta Corrente", saldo_cache=5000.00)
            conta_poupanca = Conta(usuario_id=user_id, nome="Poupança Reserva", tipo="Poupança", saldo_cache=2000.00)
            cartao = Conta(usuario_id=user_id, nome="Cartão de Crédito Visa", tipo="Cartão de Crédito", saldo_cache=0.00, limite=5000.00)
            
            contas_iniciais = [conta_corrente, conta_poupanca, cartao]
            db.add_all(contas_iniciais)
            db.commit()
            
            # Recarregar objetos para ter o ID necessário para Transacoes
            db.refresh(conta_corrente)
            db.refresh(conta_poupanca)
            db.refresh(cartao)
            print("Dados iniciais (contas) criados!")

        # --- 5. Transações (se vazio) ---
        if db.query(Transacao).filter(Transacao.usuario_id == user_id).count() == 0:
            
            transacoes_iniciais = [
                # Receita - Salário (Conta Corrente)
                Transacao(
                    usuario_id=user_id,
                    data=datetime(2025, 11, 5, 10, 0),
                    valor=3500.00,
                    tipo="receita",
                    categoria_id=cat_salario.id if 'cat_salario' in locals() else None,
                    categoria_cache="Salário",
                    descricao="Pagamento Mensal (Salário)",
                    conta_id=conta_corrente.id,
                    origem_import="manual",
                    status="concluida",
                ),
                # Despesa - Aluguel (Conta Corrente)
                Transacao(
                    usuario_id=user_id,
                    data=datetime(2025, 11, 10, 11, 0),
                    valor=1500.00,
                    tipo="despesa",
                    categoria_id=cat_moradia.id if 'cat_moradia' in locals() else None,
                    categoria_cache="Aluguel/Moradia",
                    descricao="Aluguel de Novembro",
                    conta_id=conta_corrente.id,
                    origem_import="manual",
                    status="concluida",
                ),
                # Despesa - Cartão (Parcelado)
                Transacao(
                    usuario_id=user_id,
                    data=datetime(2025, 11, 11, 12, 0),
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
                ),
                # Investimento (Conta Poupança)
                Transacao(
                    usuario_id=user_id,
                    data=datetime(2025, 11, 12, 12, 0),
                    valor=500.00,
                    tipo="investimento",
                    categoria_id=cat_investimento.id if 'cat_investimento' in locals() else None,
                    categoria_cache="Ações",
                    descricao="Compra de Ações - XPTO3",
                    conta_id=conta_poupanca.id,
                    origem_import="manual",
                    status="concluida",
                ),
            ]
            db.add_all(transacoes_iniciais)
            db.commit()
            print("Dados iniciais (transações) criados!")


    except Exception as e:
        # Em caso de erro, desfaz as alterações e imprime o erro
        print(f"Erro ao popular dados: {e}")
        db.rollback() 
    finally:
        # **CRUCIAL**: Garante que a sessão do banco de dados seja fechada
        db.close() 
        print("População de dados finalizada.")