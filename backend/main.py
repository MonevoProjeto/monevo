from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from typing import List, Optional
import os
from datetime import datetime, date
from passlib.hash import bcrypt

<<<<<<< Updated upstream
from contextlib import asynccontextmanager
import os, logging


from models import Meta, MetaCreate, MetaUpdate, CategoriaRead, CategoriaCreate, CategoriaUpdate, ContaCreate, ContaRead, ContaUpdate,RecorrenciaCreate, RecorrenciaRead, RecorrenciaUpdate, TransacaoCreate, TransacaoRead, TransacaoUpdate, FaturaRead
=======
from models import (
    Meta, MetaCreate, MetaUpdate,
    CategoriaRead, CategoriaCreate, CategoriaUpdate,
    ContaCreate, ContaRead, ContaUpdate,
    RecorrenciaCreate, RecorrenciaRead, RecorrenciaUpdate,
    TransacaoCreate, TransacaoRead, TransacaoUpdate,
    FaturaRead,
    Usuario, UsuarioCreate,
    Produto, ProdutoCreate, Foto
)
>>>>>>> Stashed changes

from database import (
    get_db, create_tables, populate_initial_data,
    Conta, Recorrencia, Categoria, Transacao, MetaTable, UsuarioTable,
    ProdutoTable, FotoTable
)

from auth import pegar_usuario_atual
from auth_routes import router as auth_router


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app")

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        logger.info("Lifespan: startup")
        create_tables()
        populate_initial_data()
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

app = FastAPI(title="Monevo API", version="1.0.0",lifespan=lifespan)

# ajuste as origens conforme seu ambiente
ALLOWED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
]


""" @app.on_event("startup")
def on_startup():
<<<<<<< Updated upstream
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

=======
    """Inicializa as tabelas e popula dados de exemplo."""
    create_tables()
    populate_initial_data()
    if os.getenv("WEBSITE_INSTANCE_ID"):
        print("Executando no Azure App Service")
    else:
        print("Executando localmente")

>>>>>>> Stashed changes

@app.get("/")
def root():
    ambiente = "Azure" if os.getenv("WEBSITE_INSTANCE_ID") else "Local"
    banco = "SQL Server" if not os.getenv("DATABASE_URL", "").startswith("sqlite") else "SQLite"
    return {"message": "Monevo API - Gestão de Metas Financeiras", "ambiente": ambiente, "banco": banco}


# -----------------------------------
# METAS
# -----------------------------------
@app.get("/metas", response_model=List[Meta])
def listar_metas(db: Session = Depends(get_db)):
    metas = db.query(MetaTable).order_by(MetaTable.data_criacao.desc()).all()
    return metas

@app.post("/metas", response_model=Meta, status_code=201)
def criar_meta(meta: MetaCreate, db: Session = Depends(get_db)):
    if meta.valor_atual > meta.valor_objetivo:
        raise HTTPException(status_code=422, detail="valor_atual não pode ser maior que valor_objetivo")
    nova = MetaTable(
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

@app.get("/metas/{meta_id}", response_model=Meta)
def buscar_meta(meta_id: int, db: Session = Depends(get_db)):
    m = db.query(MetaTable).filter(MetaTable.id == meta_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    return m

@app.patch("/metas/{meta_id}", response_model=Meta)
def atualizar_meta(meta_id: int, payload: MetaUpdate, db: Session = Depends(get_db)):
    m = db.query(MetaTable).filter(MetaTable.id == meta_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    data = payload.dict(exclude_unset=True)
    novo_valor_atual = data.get("valor_atual", m.valor_atual)
    novo_valor_objetivo = data.get("valor_objetivo", m.valor_objetivo)
    if novo_valor_atual > novo_valor_objetivo:
        raise HTTPException(status_code=422, detail="valor_atual não pode ser maior que valor_objetivo")
    for k, v in data.items():
        setattr(m, k, v)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@app.delete("/metas/{meta_id}", status_code=204)
def deletar_meta(meta_id: int, db: Session = Depends(get_db)):
    m = db.query(MetaTable).filter(MetaTable.id == meta_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    db.delete(m)
    db.commit()
    return {}


# -----------------------------------
# CATEGORIAS
# -----------------------------------
@app.get("/categorias/{categoria_id}", response_model=CategoriaRead)
def buscar_categoria(categoria_id: int, db: Session = Depends(get_db)):
    c = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return c

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


# -----------------------------------
# CONTAS
# -----------------------------------
@app.get("/contas", response_model=List[ContaRead])
def listar_contas(usuario_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Conta)
    if usuario_id:
        q = q.filter(Conta.usuario_id == usuario_id)
    return q.order_by(Conta.id.desc()).all()

@app.post("/contas", response_model=ContaRead, status_code=201)
def criar_conta(payload: ContaCreate, db: Session = Depends(get_db)):
    c = Conta(
        usuario_id=payload.usuario_id,
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
def buscar_conta(conta_id: int, db: Session = Depends(get_db)):
    c = db.query(Conta).filter(Conta.id == conta_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    return c

@app.patch("/contas/{conta_id}", response_model=ContaRead)
def atualizar_conta(conta_id: int, payload: ContaUpdate, db: Session = Depends(get_db)):
    c = db.query(Conta).filter(Conta.id == conta_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(c, k, v)
    db.add(c)
    db.commit()
    db.refresh(c)
    return c

@app.delete("/contas/{conta_id}", status_code=204)
def deletar_conta(conta_id: int, db: Session = Depends(get_db)):
    c = db.query(Conta).filter(Conta.id == conta_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Conta não encontrada")
    db.delete(c)
    db.commit()
    return {}


# -----------------------------------
# RECURRÊNCIAS
# -----------------------------------
@app.get("/recorrencias", response_model=List[RecorrenciaRead])
def listar_recorrencias(usuario_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Recorrencia)
    if usuario_id:
        q = q.filter(Recorrencia.usuario_id == usuario_id)
    return q.order_by(Recorrencia.id.desc()).all()

@app.post("/recorrencias", response_model=RecorrenciaRead, status_code=201)
def criar_recorrencia(payload: RecorrenciaCreate, db: Session = Depends(get_db)):
    r = Recorrencia(
        usuario_id=payload.usuario_id,
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
def buscar_recorrencia(rec_id: int, db: Session = Depends(get_db)):
    r = db.query(Recorrencia).filter(Recorrencia.id == rec_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recorrência não encontrada")
    return r

@app.patch("/recorrencias/{rec_id}", response_model=RecorrenciaRead)
def atualizar_recorrencia(rec_id: int, payload: RecorrenciaUpdate, db: Session = Depends(get_db)):
    r = db.query(Recorrencia).filter(Recorrencia.id == rec_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recorrência não encontrada")
    data = payload.dict(exclude_unset=True)
    for k, v in data.items():
        setattr(r, k, v)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

@app.delete("/recorrencias/{rec_id}", status_code=204)
def deletar_recorrencia(rec_id: int, db: Session = Depends(get_db)):
    r = db.query(Recorrencia).filter(Recorrencia.id == rec_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Recorrência não encontrada")
    db.delete(r)
    db.commit()
    return {}


# -----------------------------------
# TRANSAÇÕES
# -----------------------------------
@app.get("/transacoes", response_model=List[TransacaoRead])
def listar_transacoes(
    usuario_id: Optional[int] = None,
    conta_id: Optional[int] = None,
    tipo: Optional[str] = None,
    categoria_id: Optional[int] = None,
    meta_id: Optional[int] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    q = db.query(Transacao)
    if usuario_id:
        q = q.filter(Transacao.usuario_id == usuario_id)
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
def criar_transacao(payload: TransacaoCreate, db: Session = Depends(get_db)):
    data = payload.data or datetime.utcnow()
    novo = Transacao(
        usuario_id=payload.usuario_id,
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

    # categoria mapping
    if payload.categoria_id:
        cat = db.query(Categoria).filter(Categoria.id == payload.categoria_id).first()
        if cat:
            novo.categoria_id = cat.id
            novo.categoria_cache = cat.nome
    elif payload.categoria:
        chave = payload.categoria.strip().lower().replace(" ", "_")
        cat = db.query(Categoria).filter(
            or_(Categoria.chave == chave, Categoria.nome.ilike(payload.categoria.strip()))
        ).first()
        if cat:
            novo.categoria_id = cat.id
            novo.categoria_cache = cat.nome
        else:
            novo.categoria_cache = payload.categoria.strip()

    # calcular alocado_valor
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
            novo.conta_cache = conta.nome

    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


# -----------------------------------
# USUÁRIOS
# -----------------------------------
@app.post("/usuarios", response_model=Usuario, status_code=201)
def criar_usuario(payload: UsuarioCreate, db: Session = Depends(get_db)):
    exists = db.query(UsuarioTable).filter(UsuarioTable.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=422, detail="Usuário com este email já existe")
    u = UsuarioTable(
        nome=payload.nome,
        email=payload.email,
        senha_hash=bcrypt.hash(payload.senha)
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u

@app.get("/usuarios/{usuario_id}", response_model=Usuario)
def buscar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    u = db.query(UsuarioTable).filter(UsuarioTable.id == usuario_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return u


# -----------------------------------
# PRODUTOS (CRUD + UPLOAD)
# -----------------------------------

CATEGORIAS_VALIDAS = ["eletrônicos", "roupas", "cosméticos", "livros"]  # exemplo de categorias válidas

@app.get("/produtos", response_model=List[Produto])
def listar_produtos(db: Session = Depends(get_db)):
    produtos = db.query(ProdutoTable).order_by(ProdutoTable.data_criacao.desc()).all()
    return produtos


@app.post("/produtos", response_model=Produto, status_code=201)
def criar_produto(
    produto: ProdutoCreate, 
    user_id: int = Depends(pegar_usuario_atual),  # AUTENTICAÇÃO
    db: Session = Depends(get_db)
):
    if produto.categoria not in CATEGORIAS_VALIDAS:
        raise HTTPException(
            status_code=422, 
            detail=f"Categoria inválida. Use uma destas: {', '.join(CATEGORIAS_VALIDAS)}"
        )
    
    db_produto = ProdutoTable(
        titulo=produto.titulo,
        descricao=produto.descricao,
        preco=produto.preco,
        categoria=produto.categoria,
        vendedor=produto.vendedor,
        usuario_id=user_id
    )
    
    db.add(db_produto)
    db.commit()
    db.refresh(db_produto)
    return db_produto


@app.put("/produtos/{produto_id}", response_model=Produto)
def atualizar_produto(
    produto_id: int, 
    produto_atualizado: ProdutoCreate, 
    user_id: int = Depends(pegar_usuario_atual),  # AUTENTICAÇÃO
    db: Session = Depends(get_db)
):
    produto = db.query(ProdutoTable).filter(ProdutoTable.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    if produto.usuario_id != user_id:
        raise HTTPException(
            status_code=403, 
            detail="Você não pode editar este produto! Apenas o dono pode."
        )
    
    if produto_atualizado.categoria not in CATEGORIAS_VALIDAS:
        raise HTTPException(
            status_code=422, 
            detail=f"Categoria inválida. Use uma destas: {', '.join(CATEGORIAS_VALIDAS)}"
        )
    
    produto.titulo = produto_atualizado.titulo
    produto.descricao = produto_atualizado.descricao
    produto.preco = produto_atualizado.preco
    produto.categoria = produto_atualizado.categoria
    produto.vendedor = produto_atualizado.vendedor
    
    db.commit()
    db.refresh(produto)
    return produto


@app.delete("/produtos/{produto_id}")
def deletar_produto(
    produto_id: int, 
    user_id: int = Depends(pegar_usuario_atual),  # AUTENTICAÇÃO
    db: Session = Depends(get_db)
):
    produto = db.query(ProdutoTable).filter(ProdutoTable.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    if produto.usuario_id != user_id:
        raise HTTPException(
            status_code=403, 
            detail="Você não pode deletar este produto! Apenas o dono pode."
        )
    
    db.delete(produto)
    db.commit()
    return {"message": "Produto removido com sucesso"}


@app.post("/produtos/{produto_id}/fotos", response_model=Foto)
async def upload_foto(
    produto_id: int, 
    file: UploadFile = File(...),
    user_id: int = Depends(pegar_usuario_atual),  # AUTENTICAÇÃO
    db: Session = Depends(get_db)
):
    produto = db.query(ProdutoTable).filter(ProdutoTable.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    if produto.usuario_id != user_id:
        raise HTTPException(
            status_code=403, 
            detail="Você só pode adicionar fotos aos seus próprios produtos!"
        )
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=422, detail="Arquivo deve ser uma imagem")
    
    caminho = f"uploads/{produto_id}_{file.filename}"
    os.makedirs(os.path.dirname(caminho), exist_ok=True)
    with open(caminho, "wb") as f:
        f.write(await file.read())
    
    foto = FotoTable(
        produto_id=produto_id,
        caminho=caminho,
        criado_em=datetime.utcnow()
    )
    db.add(foto)
    db.commit()
    db.refresh(foto)
    return foto


# -----------------------------------
# CONFIGURAÇÕES CORS
# -----------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

