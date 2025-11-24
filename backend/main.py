from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse # ADICIONADO: Para redirecionar no OAuth
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional
import os
from datetime import datetime, date

# --- NOVAS IMPORTAÇÕES GOOGLE AUTH ---
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth
from jose import jwt
from dotenv import load_dotenv
# -------------------------------------

# senha hashing via auth.criar_hash_senha


from contextlib import asynccontextmanager
import os, logging

#importando os schemas pydantic de entrada/saída
#validam request e formatam a response
from models import (
    Meta, MetaCreate, MetaUpdate,
    CategoriaRead, CategoriaCreate, CategoriaUpdate,
    ContaCreate, ContaRead, ContaUpdate,
    RecorrenciaCreate, RecorrenciaRead, RecorrenciaUpdate,
    TransacaoCreate, TransacaoRead, TransacaoUpdate,
    FaturaRead,
    Usuario, UsuarioCreate, LoginResponse,
    OnboardingCreate, OnboardingRead, OnboardingUpdate,
    NotificacaoRead, NotificacaoUpdate
)

#importando as entidades e tabelas
#get_db --> sessão por requisição
#sqlaclhemy 

from database import (
    get_db, create_tables, populate_initial_data,
    Conta, Recorrencia, Categoria, Transacao, MetaTable, UsuarioTable,
    OnboardingProfileTable, OnboardingGoalTable,
    Orcamento, Notificacao
)

#autenticação 
#rotas de login/registro 
#usa token JWT 
from auth import pegar_usuario_atual, criar_hash_senha, criar_token
from auth_routes import router as auth_router

from ia_routes import router as ia_router

# --- CONFIGURAÇÃO GOOGLE AUTH ---
load_dotenv()
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "secret") # Fallback seguro apenas para dev
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# --------------------------------

#normalizando valores monetarios que vierem do front 
#trata se vier no formato "americano" ou "brasileiro"
def _parse_currency(value):
    if value is None:
        return None
    try:
        if isinstance(value, (int, float)):
            return float(value)
        s = str(value).strip()
        # remover símbolo de moeda e espaços
        s = s.replace('R$', '').replace('r$', '').replace('\u00a0', '').strip()
        # remover pontos como separadores de milhar e trocar vírgula por ponto para decimais
        # ex: '5.000,50' -> '5000.50'
        # mas se a string já estiver no formato americano '5,000.50' iremos remover as vírgulas
        if ',' in s and '.' in s:
            # presumimos formato pt-BR: milhares com ponto e decimais com vírgula
            s = s.replace('.', '').replace(',', '.')
        else:
            # remover milhares (vírgulas) e deixar ponto decimal
            s = s.replace(',', '.')
        # remover quaisquer espaços restantes
        s = s.replace(' ', '')
        return float(s)
    except Exception:
        return None

#LOG --> historico de mensagens que a aplicação escreve quando roda 
#lifespan --> ciclo de vida da aplicação (cuida de startup/shutdown) --> roda codigo na inicialização e finalização da app
#ajusta comportamento --> não popular dados iniciais em produção 
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        #STARTUP: roda ates do app aceitar requisições
        logger.info("Lifespan: startup")
        create_tables()
        populate_initial_data() #so faz sentido localmente
        if os.getenv("WEBSITE_INSTANCE_ID"):
            logger.info("Azure App Service detectado")
        else:
            logger.info("Ambiente local detectado")
        yield
    except Exception:
        logger.exception("Erro durante lifespan startup")
        # raise  # se quiser falhar hard
    finally:
        logger.info("Lifespan: shutdown")
        #SHUTDOWN: roda quando o app vai encerrar --> fecha conexões, limpa recursos, etc.


app = FastAPI(title="Monevo API", version="1.0.0",lifespan=lifespan)

#CORS: libera origens confiáveis (localhosts + dominios do azure)
# necessário para usar o react, pois eles te dominios diferentes para conseguir chamar a API no navegador 
# ajuste as origens conforme seu ambiente
ALLOWED_ORIGINS = [
        "http://localhost:5173",   # se estiver usando Vite padrão
        "http://127.0.0.1:5173",   # se acessar pelo 127
        "http://localhost:8080",   # o seu caso atual
        "http://127.0.0.1:8080",   # segurança extra
        "http://localhost:8081",   # porta usada pelo frontend no ambiente local
        "http://127.0.0.1:8081",
        "https://monevobackend-a7f8etedfze0atg6.centralus-01.azurewebsites.net",
        "https://agreeable-bay-022216d10.3.azurestaticapps.net",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        # ADICIONADO: Origem para callback local do Google se necessário
        "http://localhost:8000"
]

# 1️⃣ Session primeiro (mais "por dentro")
app.add_middleware(
    SessionMiddleware,
    secret_key=JWT_SECRET_KEY,
    session_cookie="google_oauth_session",
)

# 2️⃣ CORS por último (mais "por fora")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"^https:\/\/.*\.azurestaticapps\.net$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#roda em qualquer porta local e o navegador vai ter comunicação com o back 


oauth = OAuth()
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}, 
)
# ---------------------------------------------------


# importa e liga as rotas de autenticação ao app principal 
app.include_router(auth_router)

app.include_router(ia_router)


# --- NOVAS ROTAS DE AUTENTICAÇÃO GOOGLE ---

@app.get("/auth/google/login")
async def google_login(request: Request):
    """ Rota que inicia o processo de login no Google. """
    # O Redirect URI deve estar cadastrado no Google Cloud Console
    redirect_uri = request.url_for('google_auth_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

from urllib.parse import quote

@app.get("/auth/google/callback", name="google_auth_callback")
async def google_auth_callback(request: Request, db: Session = Depends(get_db)):
    """ Rota que o Google chama de volta. Processa o código e gera o JWT. """
    try:
        # troca código -> token
        token = await oauth.google.authorize_access_token(request)

        # pega endpoint de userinfo da config do Google
        userinfo_endpoint = oauth.google.server_metadata.get("userinfo_endpoint")
        if not userinfo_endpoint:
            raise RuntimeError("userinfo_endpoint nao encontrado")

        # busca dados do usuário
        resp = await oauth.google.get(userinfo_endpoint, token=token)
        user_info = resp.json()

        email = user_info.get("email")
        name = user_info.get("name", "Usuário Google")

        if not email:
            return RedirectResponse(
                f"{FRONTEND_URL}/auth/callback?error=email_nao_encontrado",
                status_code=302,
            )

        # procura usuário no banco
        user = db.query(UsuarioTable).filter(UsuarioTable.email == email).first()

        if not user:
            # novo usuário via Google
            temp_senha = os.urandom(16).hex()
            senha_hash = criar_hash_senha(temp_senha)

            novo_usuario = UsuarioTable(
                email=email,
                nome=name,
                senha_hash=senha_hash,
                onboarding_step=0,
            )
            db.add(novo_usuario)
            db.commit()
            db.refresh(novo_usuario)

            # manda direto pro onboarding
            return RedirectResponse(
                f"{FRONTEND_URL}/onboarding?user_id={novo_usuario.id}&oauth=google",
                status_code=302,
            )

        # usuário já existe -> gera JWT
        token_jwt = criar_token(user.id)

        return RedirectResponse(
            f"{FRONTEND_URL}/auth/callback?token={token_jwt}",
            status_code=302,
        )

    except Exception as e:
        logger.exception(f"Erro no Google Callback: {e}")
        # manda o tipo do erro na URL pra gente ver
        err = quote(type(e).__name__)
        return RedirectResponse(
            f"{FRONTEND_URL}/auth/callback?error={err}",
            status_code=302,
        )

# ------------------------------------------


#criado para rodar dados ao iniciar a aplicação 
#popular tabelas para teste 
#NAO USAMOS MAIS 
""" @app.on_event("startup")
def on_startup():
    #Inicializa as tabelas e (localmente) popula dados de exemplo."""
    #create_tables()
    #populate_initial_data()
    #if os.getenv("WEBSITE_INSTANCE_ID"):
        #print("Executando no Azure App Service")
    #else:
        #print("Executando localmente")

# Base de dados temporária (em memória)
# metas_db = []
# next_id = 1 """


# ponto de entrada da API 
# rota de status/sistema  
@app.get("/")
def root():
    # verifica se existe variavel de ambiente do azure, se tiver roda no azure, se não, roda local
    ambiente = "Azure" if os.getenv("WEBSITE_INSTANCE_ID") else "Local"
    #checa o banco usado se for no azure ou local
    banco = "SQL Server" if not os.getenv("DATABASE_URL", "").startswith("sqlite") else "SQLite"
    #devolve o json com as infos corretas 
    return {"message": "Monevo API - Gestão de Metas Financeiras", "ambiente": ambiente, "banco": banco}


#METAS --------------------------------
#listar metas 
#retorna somente as metas pertencentes ao usuário autenticado
#usa depends e filtra por usuario_id --> evita vazamento de dados entre usuários

#segurança multiusuário: lista apenas as metas do usuário logado
#ordena por data de criação decrescente (mais recentes primeiro)

#depends = injeção de dependencias 
# podemos reaproveitar lógica em varias rotas 
#antes de rodar, as dependencias são chamadas automaticamente e o valor retornado é injetado nos parametros (user_id e db)
@app.get("/metas", response_model=List[Meta])
def listar_metas(
    user_id: int = Depends(pegar_usuario_atual), #autentica o usuario via token
    db: Session = Depends(get_db) #abre uma sesao com o banco e fecha automaticamente
):
    metas = db.query(MetaTable).filter(
        MetaTable.usuario_id == user_id
    ).order_by(MetaTable.data_criacao.desc()).all()
    return metas

# criar meta 
# validação de negocio: impede metas incoerentes 
# força usuario do token a ser dono da meta criada
@app.post("/metas", response_model=Meta, status_code=201)
def criar_meta(
    meta: MetaCreate, 
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    # Regra opcional: valor_atual não pode exceder o objetivo
    if meta.valor_atual > meta.valor_objetivo:
        raise HTTPException(status_code=422, detail="valor_atual não pode ser maior que valor_objetivo")
# informações da nova meta a serem armazenadas
    nova = MetaTable(
        usuario_id=user_id,
        titulo=meta.titulo,
        descricao=meta.descricao,
        categoria=meta.categoria,
        valor_objetivo=meta.valor_objetivo,
        valor_atual=meta.valor_atual,
        prazo=meta.prazo,
    )
    db.add(nova)
    db.commit()
    db.refresh(nova)
    return nova

#buscar uma meta especifica 
#combina id + usuario_id no filtro --> usuário nao pode ver meta dos outros 
# retorna 404 quando a meta não é do usuário 
@app.get("/metas/{meta_id}", response_model=Meta)
def buscar_meta(
    meta_id: int, 
    user_id: int = Depends(pegar_usuario_atual), 
    db: Session = Depends(get_db)
):
    # Busca pela meta E pelo ID do usuário
    m = db.query(MetaTable).filter(
        MetaTable.id == meta_id,
        MetaTable.usuario_id == user_id 
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    return m

# atualizar meta PARCIALMENTE 

@app.patch("/metas/{meta_id}", response_model=Meta)
def atualizar_meta(
    meta_id: int, 
    payload: MetaUpdate, 
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    # Busca pela meta E pelo ID do usuário
    m = db.query(MetaTable).filter(
        MetaTable.id == meta_id,
        MetaTable.usuario_id == user_id 
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meta não encontrada")

    data = payload.dict(exclude_unset=True) #só atualiza os campos enviados, mantendo os outros 
 
    # revalida a consistencia considerando valores antigos e novos 
    # Regra: valor_atual não pode exceder valor_objetivo (considera valores novos ou atuais)
    novo_valor_atual = data.get("valor_atual", m.valor_atual)
    novo_valor_objetivo = data.get("valor_objetivo", m.valor_objetivo)
    if (
        novo_valor_atual is not None
        and novo_valor_objetivo is not None
        and novo_valor_atual > novo_valor_objetivo
    ):
        raise HTTPException(status_code=422, detail="valor_atual não pode ser maior que valor_objetivo")

    for k, v in data.items():
        setattr(m, k, v)

    db.add(m)
    db.commit()
    db.refresh(m)
    return m

"""
poderiamos ter criado um UPDATE (atualiza tudo)
reenvia todos os campos e tudo antigo é desconsiderado 

@app.put("/metas/{meta_id}", response_model=Meta)
def substituir_meta(
    meta_id: int,
    payload: MetaCreate,  # <- modelo completo
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    # 1) garantir que a meta existe e pertence ao usuário
    m = db.query(MetaTable).filter(
        MetaTable.id == meta_id,
        MetaTable.usuario_id == user_id
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meta não encontrada")

    # 2) regra de negócio: coerência
    if payload.valor_atual is not None and payload.valor_objetivo is not None:
        if payload.valor_atual > payload.valor_objetivo:
            raise HTTPException(status_code=422, detail="valor_atual não pode ser maior que valor_objetivo")

    # 3) substituir TODOS os campos (semântica de PUT)
    m.titulo = payload.titulo
    m.descricao = payload.descricao
    m.categoria = payload.categoria
    m.valor_objetivo = payload.valor_objetivo
    m.valor_atual = payload.valor_atual
    m.prazo = payload.prazo

    db.add(m)
    db.commit()
    db.refresh(m)
    return m
"""
# APAGAR meta 
@app.delete("/metas/{meta_id}", status_code=204)
def deletar_meta(
    meta_id: int, 
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    # Busca pela meta E pelo ID do usuário
    m = db.query(MetaTable).filter(
        MetaTable.id == meta_id,
        MetaTable.usuario_id == user_id 
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    db.delete(m)
    db.commit()
    return {}

#retorna 204 No Content se deleta com sucesso 
# 404 se não existir ou for de outro usuario 

# CATEGORIAS ------------------------------------------

@app.get("/categorias/{categoria_id}", response_model=CategoriaRead)
def buscar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    c = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return c

# chave unica (validada em app e db)
@app.post("/categorias", response_model=CategoriaRead, status_code=201)
def criar_categoria(payload: CategoriaCreate, db: Session = Depends(get_db)):
    exists = db.query(Categoria).filter(Categoria.chave == payload.chave).first()
    if exists:
        raise HTTPException(status_code=422, detail="Categoria com essa chave já existe")
    c = Categoria(
        tipo=payload.tipo,
        chave=payload.chave,
        nome=payload.nome,
        ordem=payload.ordem or 0,
        parent_id=payload.parent_id
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

# atualiza parcial com exclude_unset
@app.patch("/categorias/{categoria_id}", response_model=CategoriaRead)
def atualizar_categoria(categoria_id: int, payload: CategoriaUpdate, db: Session = Depends(get_db)):
    c = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@app.delete("/categorias/{categoria_id}", status_code=204)
def deletar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    c = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    db.delete(c)
    db.commit()
    return {}

#possiveis ajustes:
# poderia restringir a rota de admin (so admin pode deletar categorias)
# admin_id: int = Depends(exigir_admin)  # ou verificar papel no token


# -------------------------
# Contas (CRUD)
# -------------------------
@app.get("/contas", response_model=List[ContaRead])
def listar_contas(
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    # Sempre filtra pelo usuário do token, não pelo query param
    q = db.query(Conta).filter(Conta.usuario_id == user_id)
    return q.order_by(Conta.id.desc()).all()


@app.post("/contas", response_model=ContaRead, status_code=201)
def criar_conta(payload: ContaCreate, user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    # O usuário autenticado será o dono da conta; ignoramos payload.usuario_id por segurança
    c = Conta(
        usuario_id=user_id,
        tipo=payload.tipo,
        nome=payload.nome,
        fechamento_cartao_dia=payload.fechamento_cartao_dia,
        vencimento_cartao_dia=payload.vencimento_cartao_dia
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@app.get("/contas/{conta_id}", response_model=ContaRead)
def buscar_conta(
    conta_id: int, 
    user_id: int = Depends(pegar_usuario_atual), # <-- CORRIGIDO
    db: Session = Depends(get_db)
):
    c = db.query(Conta).filter(
        Conta.id == conta_id,
        Conta.usuario_id == user_id # <-- CORRIGIDO
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return c



@app.patch("/contas/{conta_id}", response_model=ContaRead)
def atualizar_conta(conta_id: int, payload: ContaUpdate, user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    c = db.query(Conta).filter(Conta.id == conta_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    if c.usuario_id != user_id:
        raise HTTPException(status_code=403, detail="Você não pode editar esta conta")
    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@app.delete("/contas/{conta_id}", status_code=204)
def deletar_conta(conta_id: int, user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    c = db.query(Conta).filter(Conta.id == conta_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    if c.usuario_id != user_id:
        raise HTTPException(status_code=403, detail="Você não pode deletar esta conta")
    db.delete(c)
    db.commit()
    return {}


# -------------------------
# Recorrências (CRUD)
# -------------------------
@app.get("/recorrencias", response_model=List[RecorrenciaRead])
def listar_recorrencias(
    user_id: int = Depends(pegar_usuario_atual), 
    db: Session = Depends(get_db)
):
    # Filtra pelo usuário do token
    q = db.query(Recorrencia).filter(Recorrencia.usuario_id == user_id)
    return q.order_by(Recorrencia.id.desc()).all()



@app.post("/recorrencias", response_model=RecorrenciaRead, status_code=201)
def criar_recorrencia(payload: RecorrenciaCreate, user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    # Usa o usuário autenticado como dono da recorrência
    r = Recorrencia(
        usuario_id=user_id,
        nome=payload.nome,
        tipo=payload.tipo,
        periodicidade=payload.periodicidade,
        dia_base=payload.dia_base,
        valor=payload.valor,
        conta_id=payload.conta_id,
        alocacao_percentual=payload.alocacao_percentual,
        ativo=payload.ativo
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@app.get("/recorrencias/{rec_id}", response_model=RecorrenciaRead)
def buscar_recorrencia(
    rec_id: int, 
    user_id: int = Depends(pegar_usuario_atual), 
    db: Session = Depends(get_db)
):
    r = db.query(Recorrencia).filter(
        Recorrencia.id == rec_id,
        Recorrencia.usuario_id == user_id 
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recorrência não encontrada")
    return r


@app.patch("/recorrencias/{rec_id}", response_model=RecorrenciaRead)
def atualizar_recorrencia(rec_id: int, payload: RecorrenciaUpdate, user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    r = db.query(Recorrencia).filter(Recorrencia.id == rec_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recorrência não encontrada")
    if r.usuario_id != user_id:
        raise HTTPException(status_code=403, detail="Você não pode editar esta recorrência")
    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(r, k, v)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@app.delete("/recorrencias/{rec_id}", status_code=204)
def deletar_recorrencia(rec_id: int, user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    r = db.query(Recorrencia).filter(Recorrencia.id == rec_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recorrência não encontrada")
    if r.usuario_id != user_id:
        raise HTTPException(status_code=403, detail="Você não pode deletar esta recorrência")
    db.delete(r)
    db.commit()
    return {}

 
# -------------------------
# Transações (CRUD + filtros + lógica de meta)
# -------------------------
@app.get("/transacoes", response_model=List[TransacaoRead])
def listar_transacoes(
    # Parâmetros de filtro
    conta_id: Optional[int] = None,
    tipo: Optional[str] = None,
    categoria_id: Optional[int] = None,
    meta_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    # Segurança
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    # Filtra sempre pelo usuário do token
    q = db.query(Transacao).filter(Transacao.usuario_id == user_id) 
    
    # Filtros adicionais (opcionais)
    if conta_id:
        q = q.filter(Transacao.conta_id == conta_id)
    if tipo:
        q = q.filter(Transacao.tipo == tipo)
    if categoria_id:
        q = q.filter(Transacao.categoria_id == categoria_id)
    if meta_id:
        q = q.filter(Transacao.meta_id == meta_id)
    if date_from:
        q = q.filter(Transacao.data >= date_from)
    if date_to:
        q = q.filter(Transacao.data <= date_to)
    
    q = q.order_by(Transacao.data.desc()).offset(skip).limit(limit)
    return q.all()


@app.post("/transacoes", response_model=TransacaoRead, status_code=201)
def criar_transacao(
    payload: TransacaoCreate,
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    data = payload.data or datetime.utcnow()
    novo = Transacao(
        usuario_id=user_id,
        data=data,
        valor=payload.valor,
        tipo=payload.tipo,
        conta_id=payload.conta_id,
        cartao_id=payload.cartao_id,
        descricao=payload.descricao,
        parcelas_total=payload.parcelas_total,
        parcela_num=payload.parcela_num,
        referencia=payload.referencia,
        origem_import=payload.origem_import,
        meta_id=payload.meta_id,
        alocacao_percentual=payload.alocacao_percentual,
        status=payload.status
    )

    # ---------------------------
    # 🔹 Mapeamento da categoria
    # ---------------------------
    categoria_nome = None

    if payload.categoria_id:
        cat = db.query(Categoria).filter(Categoria.id == payload.categoria_id).first()
        if cat:
            novo.categoria_id = cat.id
            categoria_nome = cat.nome

    elif payload.categoria:
        # ex.: "Transporte" -> chave "transporte"
        chave = payload.categoria.strip().lower().replace(" ", "_")
        cat = db.query(Categoria).filter(
            or_(Categoria.chave == chave, Categoria.nome.ilike(payload.categoria.strip()))
        ).first()
        if cat:
            novo.categoria_id = cat.id
            categoria_nome = cat.nome
        else:
            # não achou na tabela categorias → usa texto bruto
            categoria_nome = payload.categoria.strip()

    # Preenche sempre o cache e o atributo "categoria" (usado pelo schema)
    if categoria_nome:
        novo.categoria_cache = categoria_nome
        # atributo python, mesmo sem coluna, para aparecer no response_model
        setattr(novo, "categoria", categoria_nome)

    # ---------------------------
    # alocado_valor
    # ---------------------------
    if novo.alocacao_percentual:
        try:
            novo.alocado_valor = float(novo.valor) * float(novo.alocacao_percentual) / 100.0
        except Exception:
            novo.alocado_valor = 0.0
    else:
        novo.alocado_valor = 0.0

    # conta cache
    if novo.conta_id:
        conta = db.query(Conta).filter(Conta.id == novo.conta_id).first()
        if conta:
            novo.conta_nome_cache = conta.nome

    # atualizar meta incremental
    if novo.meta_id and novo.alocado_valor:
        meta = db.query(MetaTable).filter(
            MetaTable.id == novo.meta_id,
            MetaTable.usuario_id == user_id
        ).first()
        if meta:
            novo.meta_nome_cache = meta.titulo
            meta.valor_atual = (meta.valor_atual or 0.0) + novo.alocado_valor
            db.add(meta)

    db.add(novo)
    db.commit()
    db.refresh(novo)

    # garante que o atributo "categoria" exista também depois do refresh
    if novo.categoria_cache and not getattr(novo, "categoria", None):
        setattr(novo, "categoria", novo.categoria_cache)

    return novo



@app.get("/transacoes/{transacao_id}", response_model=TransacaoRead)
def buscar_transacao(
    transacao_id: int, 
    user_id: int = Depends(pegar_usuario_atual), 
    db: Session = Depends(get_db)
):
    t = db.query(Transacao).filter(
        Transacao.id == transacao_id,
        Transacao.usuario_id == user_id 
    ).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return t


@app.patch("/transacoes/{transacao_id}", response_model=TransacaoRead)
def atualizar_transacao(transacao_id: int, payload: TransacaoUpdate, user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    t = db.query(Transacao).filter(Transacao.id == transacao_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if t.usuario_id != user_id:
        raise HTTPException(status_code=403, detail="Você não pode editar esta transação")

    old_alocado = t.alocado_valor or 0.0
    old_meta_id = t.meta_id

    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(t, k, v)

    # recalcular alocado_valor
    try:
        t.alocado_valor = float(t.valor) * float(t.alocacao_percentual or 0.0) / 100.0
    except Exception:
        t.alocado_valor = 0.0

    new_alocado = t.alocado_valor or 0.0
    new_meta_id = t.meta_id

    # ajustar metas
    if old_meta_id and old_meta_id != new_meta_id and old_alocado:
        old_meta = db.query(MetaTable).filter(MetaTable.id == old_meta_id).first()
        if old_meta:
            old_meta.valor_atual = max(0.0, (old_meta.valor_atual or 0.0) - old_alocado)
            db.add(old_meta)

    if new_meta_id:
        meta = db.query(MetaTable).filter(MetaTable.id == new_meta_id).first()
        if meta:
            if old_meta_id == new_meta_id and old_alocado:
                meta.valor_atual = max(0.0, (meta.valor_atual or 0.0) - old_alocado)
            meta.valor_atual = (meta.valor_atual or 0.0) + new_alocado
            db.add(meta)

    db.add(t)
    db.commit()
    db.refresh(t)
    return t


@app.delete("/transacoes/{transacao_id}", status_code=204)
def deletar_transacao(transacao_id: int, user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    t = db.query(Transacao).filter(Transacao.id == transacao_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    if t.usuario_id != user_id:
        raise HTTPException(status_code=403, detail="Você não pode deletar esta transação")
    if t.meta_id and (t.alocado_valor or 0.0):
        meta = db.query(MetaTable).filter(MetaTable.id == t.meta_id).first()
        if meta:
            meta.valor_atual = max(0.0, (meta.valor_atual or 0.0) - (t.alocado_valor or 0.0))
            db.add(meta)
    db.delete(t)
    db.commit()
    return {}


# -------------------------
# Fatura (gerar relatório, somente leitura)
# -------------------------
@app.get("/faturas/generar", response_model=FaturaRead)
def gerar_fatura(
    conta_cartao_id: int, 
    inicio: date, 
    fim: date, 
    user_id: int = Depends(pegar_usuario_atual), # <-- CORRIGIDO
    db: Session = Depends(get_db)
):
    # Verificação de Segurança: O usuário é dono desta conta?
    conta = db.query(Conta).filter(
        Conta.id == conta_cartao_id,
        Conta.usuario_id == user_id
    ).first()
    if not conta:
        raise HTTPException(status_code=404, detail="Conta de cartão não encontrada ou não pertence a você")

    inicio_dt = datetime.combine(inicio, datetime.min.time())
    fim_dt = datetime.combine(fim, datetime.max.time())

    # Filtra transações pelo usuário E pela conta
    transacoes = db.query(Transacao).filter(
        Transacao.usuario_id == user_id,
        Transacao.cartao_id == conta_cartao_id,
        Transacao.data >= inicio_dt,
        Transacao.data <= fim_dt
    ).order_by(Transacao.data.asc()).all()

    total = sum([t.valor for t in transacoes]) if transacoes else 0.0
    result = {
        "conta_cartao_id": conta_cartao_id,
        "periodo_inicio": inicio,
        "periodo_fim": fim,
        "total": float(total),
        "count": len(transacoes)
    }
    return result



@app.post("/usuarios/", response_model=Usuario, status_code=201)
def criar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """Cria um novo usuário com senha criptografada"""
    # verifica se email já existe (se existe, leva erro 400)
    # evita duplicação de emails 
    existente = db.query(UsuarioTable).filter(UsuarioTable.email == usuario.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    # senha é transformada em hash antes de salvar
    senha_hash = criar_hash_senha(usuario.senha)

    # cria novo usuario 
    novo_usuario = UsuarioTable(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=senha_hash,
    )
    db.add(novo_usuario) #adiciona objeto na sessao
    db.commit() # grava no banco
    db.refresh(novo_usuario) #atualiza o objeto em memoria
    return novo_usuario 

# melhoras futuras: deixas apenas admins com essa funcionalidade 
# admin_id: int = Depends(exigir_admin)
# essas rotas são apenas para teste e administração
# a criação de usuario mesmo esta no auth_routes.py 

@app.get("/usuarios/", response_model=List[Usuario])
def listar_usuarios(db: Session = Depends(get_db)):
    """Lista todos os usuários cadastrados"""
    usuarios = db.query(UsuarioTable).all()
    return usuarios

 

@app.post("/onboarding", response_model=LoginResponse, status_code=201)
def submit_onboarding(payload: OnboardingCreate, db: Session = Depends(get_db)):
    """Recebe todos os passos do onboarding, cria usuário, perfil e metas.
    Retorna token e dados do usuário (mesma forma do /auth/login).
    """
    # step1 com dados mínimos é obrigatório
    # sem nome/email/senha não prossegue
    step1 = payload.step1
    if not step1:
        raise HTTPException(status_code=422, detail="step1 é obrigatório com nome/email/senha")

    # Verifica se usuário já existe
    existente = db.query(UsuarioTable).filter(UsuarioTable.email == step1.email).first()
    if existente:
        raise HTTPException(status_code=422, detail="Usuário com este email já existe")

    # Criar usuário
    senha_hash = criar_hash_senha(step1.senha)
    novo_usuario = UsuarioTable(
        nome=step1.nome,
        email=step1.email,
        senha_hash=senha_hash,
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    # Criar perfil de onboarding
    profile = OnboardingProfileTable(
        usuario_id=novo_usuario.id,
        idade=step1.idade,
        profissao=step1.profissao,
        cpf=step1.cpf,
        estado_civil=step1.estadoCivil,
        saldo_atual=(payload.step2.saldoAtual if payload.step2 else None),
        tipo_renda_mensal=(payload.step2.tipoRendaMensal if payload.step2 else None),
        valor_renda_mensal=(payload.step2.valorRendaMensal if payload.step2 else None),
        faixa_renda_mensal=(payload.step2.faixaRendaMensal if payload.step2 else None),
        renda_mensal=(payload.step3.rendaMensal if payload.step3 else None),
        despesa_mensal=(payload.step3.despesaMensal if payload.step3 else None),
        investimento_mensal=(payload.step3.investimentoMensal if payload.step3 else None),
        despesas_json=(__import__('json').dumps(payload.step4) if payload.step4 else None)
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    # Criar metas/objetivos
    # reexibem o onboarding (não são as metas reais do usuário)
    if payload.step3 and payload.step3.metas:
        for g in payload.step3.metas:
            goal = OnboardingGoalTable(
                onboarding_id=profile.id,
                nome=g.nome,
                valor=g.valor,
                meses=(g.meses or None)
            )
            db.add(goal)
        db.commit()

    if payload.step4:
        try:
            # O step4 vem como um dicionário: {"mercado": "500,00", "lazer": "200,00"}
            despesas_dict = payload.step4
            
            for chave_categoria, valor_str in despesas_dict.items():
                # Converte "R$ 500,00" para float 500.00
                valor_limite = _parse_currency(valor_str)
                
                # Só cria se houver um valor válido
                if valor_limite and valor_limite > 0:
                    # Busca a categoria no banco para pegar o ID correto
                    cat_obj = db.query(Categoria).filter(Categoria.chave == chave_categoria).first()
                    cat_id = cat_obj.id if cat_obj else None

                    # Cria o orçamento
                    novo_orcamento = Orcamento(
                        usuario_id=novo_usuario.id,
                        categoria_chave=chave_categoria, # ex: 'mercado'
                        categoria_id=cat_id,
                        valor_limite=valor_limite,
                        periodo="mensal"
                    )
                    db.add(novo_orcamento)
            
            db.commit() # Salva os orçamentos no banco
            logger.info(f"Orçamentos criados para usuário {novo_usuario.id}")
            
        except Exception as e:
            logger.error(f"Erro ao criar orçamentos do onboarding: {e}")

    # Criar metas reais na MetaTable ligadas ao novo usuário (não apenas ao onboarding)
    metas_to_create = []
    transacoes_to_create = []
    if payload.step3:
        s3 = payload.step3
        # Metas: criar MetaTable para cada meta enviada
        if getattr(s3, 'metas', None):
            for g in s3.metas:
                try:
                    valor_objetivo = _parse_currency(getattr(g, 'valor', None))
                except Exception:
                    valor_objetivo = None
                meta_real = MetaTable(
                    usuario_id=novo_usuario.id,
                    titulo=(getattr(g, 'nome', None) or 'Meta'),
                    descricao=None,
                    categoria=(getattr(g, 'categoria', None) or "Outros"),
                    valor_objetivo=(valor_objetivo if valor_objetivo is not None else 0.0),
                    valor_atual=0.0,
                    prazo=(getattr(g, 'meses', None) or None)
                )
                metas_to_create.append(meta_real)

        # Renda Mensal: adicionar transação de receita inicial se fornecida
        renda = _parse_currency(getattr(s3, 'rendaMensal', None))
        if renda and renda > 0:
            t_receita = Transacao(
                usuario_id=novo_usuario.id,
                data=datetime.utcnow(),
                valor=float(renda),
                tipo='receita',
                descricao='Renda Mensal (Onboarding)',
                conta_id=None
            )
            transacoes_to_create.append(t_receita)

        # Despesa Mensal: adicionar transação de despesa inicial se fornecida
        despesa = _parse_currency(getattr(s3, 'despesaMensal', None))
        if despesa and despesa > 0:
            t_despesa = Transacao(
                usuario_id=novo_usuario.id,
                data=datetime.utcnow(),
                valor=float(despesa),
                tipo='despesa',
                descricao='Despesa Mensal (Onboarding)',
                conta_id=None
            )
            transacoes_to_create.append(t_despesa)

    # Persistir metas e transações criadas (se houver)
    try:
        if metas_to_create:
            for m in metas_to_create:
                db.add(m)
        if transacoes_to_create:
            for t in transacoes_to_create:
                db.add(t)
        if metas_to_create or transacoes_to_create:
            db.commit()
            # refresh one by one to populate ids
            for m in metas_to_create:
                db.refresh(m)
            for t in transacoes_to_create:
                db.refresh(t)
    except Exception:
        # Não falhar todo o onboarding se o seeding falhar; apenas logar
        logger.exception('Falha ao criar metas/transacoes iniciais do onboarding')

    # Gerar token e retornar resposta compatível com /auth/login
    # front pode logar automaticamente após onboarding
    token = criar_token(novo_usuario.id)
    return {"token": token, "usuario": Usuario.from_orm(novo_usuario)}

# traz o estado do onboardin e as metas cadastradas
# busca usuarioTable + OnboardingProfileTable do usuario_id
# carrega as metas do OnboardingGoalTable para exibir no front 
# monta dicionarios dos passos 
# retorna um array das metas para o front preencher o forms 
@app.get("/perfil", response_model=OnboardingRead)
def obter_perfil(user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    """Retorna o perfil de onboarding do usuário autenticado (se existir)."""
    import json

    usuario = db.query(UsuarioTable).filter(UsuarioTable.id == user_id).first()
    profile = db.query(OnboardingProfileTable).filter(OnboardingProfileTable.usuario_id == user_id).first()
    metas = []
    if profile:
        goals = db.query(OnboardingGoalTable).filter(OnboardingGoalTable.onboarding_id == profile.id).all()
        for g in goals:
            metas.append({"nome": g.nome, "valor": g.valor, "meses": g.meses})

    step1 = None
    if usuario or profile:
        step1 = {
            "nome": usuario.nome if usuario else None,
            "email": usuario.email if usuario else None,
            "idade": profile.idade if profile else None,
            "profissao": profile.profissao if profile else None,
            "cpf": profile.cpf if profile else None,
            "estadoCivil": profile.estado_civil if profile else None,
        }

    step2 = None
    if profile:
        step2 = {
            "saldoAtual": profile.saldo_atual,
            "tipoRendaMensal": profile.tipo_renda_mensal,
            "valorRendaMensal": profile.valor_renda_mensal,
            "faixaRendaMensal": profile.faixa_renda_mensal,
        }

    step3 = None
    if profile:
        step3 = {
            "rendaMensal": profile.renda_mensal,
            "despesaMensal": profile.despesa_mensal,
            "investimentoMensal": profile.investimento_mensal,
            "metas": metas,
        }

    step4 = None
    if profile and profile.despesas_json:
        try:
            step4 = json.loads(profile.despesas_json)
        except Exception:
            step4 = None

    return {"step1": step1, "step2": step2, "step3": step3, "step4": step4, "metas": metas}

# permite que o usuario edite o onboarding e sincronixa isso no app 
@app.put("/perfil", response_model=OnboardingRead)
def atualizar_perfil(payload: OnboardingUpdate, user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    """Atualiza (ou cria) o perfil de onboarding para o usuário autenticado.

    Aceita campos parciais; se `step1.senha` for fornecida, atualiza a senha do usuário.
    Se forem enviadas metas em `step3.metas`, as metas existentes serão substituídas.
    """
    import json
    # garante que o usuario existe

    usuario = db.query(UsuarioTable).filter(UsuarioTable.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    profile = db.query(OnboardingProfileTable).filter(OnboardingProfileTable.usuario_id == user_id).first()
    created = False
    if not profile:
        profile = OnboardingProfileTable(usuario_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        created = True

    # Step1: nome/email/senha/idade/profissao/cpf/estadoCivil
    if payload.step1:
        s1 = payload.step1
        if s1.nome:
            usuario.nome = s1.nome
        if s1.email and s1.email != usuario.email:
            # checar se email já existe em outro usuário
            existe = db.query(UsuarioTable).filter(UsuarioTable.email == s1.email, UsuarioTable.id != user_id).first()
            if existe:
                raise HTTPException(status_code=400, detail="Email já está em uso por outro usuário")
            usuario.email = s1.email
        if s1.senha:
            usuario.senha_hash = criar_hash_senha(s1.senha)
        # profile fields
        if s1.idade is not None:
            profile.idade = s1.idade
        if s1.profissao is not None:
            profile.profissao = s1.profissao
        if s1.cpf is not None:
            profile.cpf = s1.cpf
        if s1.estadoCivil is not None:
            profile.estado_civil = s1.estadoCivil

    # Step2
    if payload.step2:
        s2 = payload.step2
        if getattr(s2, "saldoAtual", None) is not None:
            profile.saldo_atual = s2.saldoAtual
        if getattr(s2, "tipoRendaMensal", None) is not None:
            profile.tipo_renda_mensal = s2.tipoRendaMensal
        if getattr(s2, "valorRendaMensal", None) is not None:
            profile.valor_renda_mensal = s2.valorRendaMensal
        if getattr(s2, "faixaRendaMensal", None) is not None:
            profile.faixa_renda_mensal = s2.faixaRendaMensal

    # Step3
    if payload.step3:
        s3 = payload.step3
        if getattr(s3, "rendaMensal", None) is not None:
            profile.renda_mensal = s3.rendaMensal
        if getattr(s3, "despesaMensal", None) is not None:
            profile.despesa_mensal = s3.despesaMensal
        if getattr(s3, "investimentoMensal", None) is not None:
            profile.investimento_mensal = s3.investimentoMensal
        # metas: substituir se enviadas
        if getattr(s3, "metas", None) is not None:
            # remover metas antigas
            # Remove onboarding goals linked to this onboarding profile
            db.query(OnboardingGoalTable).filter(OnboardingGoalTable.onboarding_id == profile.id).delete()
            db.commit()
            for g in s3.metas:
                goal = OnboardingGoalTable(onboarding_id=profile.id, nome=g.nome, valor=g.valor, meses=(g.meses or None))
                db.add(goal)
                # - Sincroniza MetaTable de forma não destrutiva:
                # * Busca por título (case-insensitive); se existe, atualiza objetivo/prazo preservando valor_atual;
                # * Se não existe, cria nova MetaTable.
            
            try:
                for g in s3.metas:
                    nome = (getattr(g, 'nome', None) or '').strip()
                    if not nome:
                        continue
                    try:
                        valor_obj = _parse_currency(getattr(g, 'valor', None))
                    except Exception:
                        valor_obj = None
                    meses = (getattr(g, 'meses', None) or None)

                    existing_meta = db.query(MetaTable).filter(
                        MetaTable.usuario_id == user_id,
                        func.lower(MetaTable.titulo) == nome.lower()
                    ).first()

                    if existing_meta:
                        # update objetivo and prazo but keep valor_atual
                        if valor_obj is not None:
                            existing_meta.valor_objetivo = float(valor_obj)
                        if meses is not None:
                            existing_meta.prazo = meses
                        db.add(existing_meta)
                    else:
                        new_meta = MetaTable(
                            usuario_id=user_id,
                            titulo=nome,
                            descricao=None,
                            categoria=(getattr(g, 'categoria', None) or "Outros"),
                            valor_objetivo=(valor_obj if valor_obj is not None else 0.0),
                            valor_atual=0.0,
                            prazo=meses
                        )
                        db.add(new_meta)

                db.commit()
            except Exception:
                logger.exception('Falha ao sincronizar MetaTable durante atualizar_perfil')

            # update/create onboarding renda/despesa transactions below after profile persisted

    # Step4
    if getattr(payload, "step4", None) is not None:
        profile.despesas_json = json.dumps(payload.step4)

    db.add(usuario)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    db.refresh(usuario)

    # After persisting profile, also synchronize the onboarding monthly transactions (renda/despesa)
    # Update existing "Renda Mensal (Onboarding)" and "Despesa Mensal (Onboarding)" transactions if present,
    # otherwise create them so the dashboard reflects the new values.
    try:
        if payload.step3:
            s3 = payload.step3
            renda_val = _parse_currency(getattr(s3, 'rendaMensal', None))
            despesa_val = _parse_currency(getattr(s3, 'despesaMensal', None))

            # Renda
            if renda_val is not None:
                t_rec = db.query(Transacao).filter(
                    Transacao.usuario_id == user_id,
                    Transacao.tipo == 'receita',
                    Transacao.descricao == 'Renda Mensal (Onboarding)'
                ).first()
                if t_rec:
                    t_rec.valor = float(renda_val)
                    db.add(t_rec)
                else:
                    tr = Transacao(
                        usuario_id=user_id,
                        data=datetime.utcnow(),
                        valor=float(renda_val),
                        tipo='receita',
                        descricao='Renda Mensal (Onboarding)',
                        conta_id=None
                    )
                    db.add(tr)

            # Despesa
            if despesa_val is not None:
                t_desp = db.query(Transacao).filter(
                    Transacao.usuario_id == user_id,
                    Transacao.tipo == 'despesa',
                    Transacao.descricao == 'Despesa Mensal (Onboarding)'
                ).first()
                if t_desp:
                    t_desp.valor = float(despesa_val)
                    db.add(t_desp)
                else:
                    td = Transacao(
                        usuario_id=user_id,
                        data=datetime.utcnow(),
                        valor=float(despesa_val if despesa_val is not None else 0.0),
                        tipo='despesa',
                        descricao='Despesa Mensal (Onboarding)',
                        conta_id=None
                    )
                    db.add(td)

            db.commit()
    except Exception:
        logger.exception('Falha ao sincronizar transacoes de onboarding durante atualizar_perfil')

    # Reuse obter_perfil to build response
    return obter_perfil(user_id=user_id, db=db)

@app.get("/notificacoes", response_model=List[NotificacaoRead])
def listar_notificacoes(user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    """Retorna as últimas 20 notificações do usuário."""
    return db.query(Notificacao).filter(
        Notificacao.usuario_id == user_id
    ).order_by(Notificacao.created_at.desc()).limit(20).all()

@app.patch("/notificacoes/{notificacao_id}/ler")
def marcar_como_lida(notificacao_id: int, user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    """Marca uma notificação específica como lida."""
    n = db.query(Notificacao).filter(
        Notificacao.id == notificacao_id, 
        Notificacao.usuario_id == user_id
    ).first()
    
    if not n:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    n.lida = True
    db.commit()
    return {"ok": True, "message": "Notificação marcada como lida"}




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

"""
ponto de entrada onde tudo começa a funcionar 
cria a aplicação FastAPI (app = fastAPI)
conecta o banco de dados 
registra as rotas 
configura segurança e permissões 
inicializa o servidor 
"""
