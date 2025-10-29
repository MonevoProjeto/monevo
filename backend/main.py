from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional
import os
from datetime import datetime, date
from passlib.hash import bcrypt

from contextlib import asynccontextmanager
import os, logging


from models import Meta, MetaCreate, MetaUpdate, CategoriaRead, CategoriaCreate, CategoriaUpdate, ContaCreate, ContaRead, ContaUpdate,RecorrenciaCreate, RecorrenciaRead, RecorrenciaUpdate, TransacaoCreate, TransacaoRead, TransacaoUpdate, FaturaRead

from database import get_db, create_tables, populate_initial_data, Conta, Recorrencia, Categoria, Transacao, MetaTable, UsuarioTable

from models import Meta, MetaCreate, Usuario, UsuarioCreate


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
        "http://localhost:5173",   # se estiver usando Vite padrão
        "http://127.0.0.1:5173",   # se acessar pelo 127
        "http://localhost:8080",   # o seu caso atual
        "http://127.0.0.1:8080",   # segurança extra
]


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


@app.get("/")
def root():
    ambiente = "Azure" if os.getenv("WEBSITE_INSTANCE_ID") else "Local"
    banco = "SQL Server" if not os.getenv("DATABASE_URL", "").startswith("sqlite") else "SQLite"
    return {"message": "Monevo API - Gestão de Metas Financeiras", "ambiente": ambiente, "banco": banco}



@app.get("/metas", response_model=List[Meta])
def listar_metas(db: Session = Depends(get_db)):
    metas = db.query(MetaTable).order_by(MetaTable.data_criacao.desc()).all()
    # Como Meta possui orm_mode=True, podemos retornar objetos ORM diretamente
    return metas


@app.post("/metas", response_model=Meta, status_code=201)
def criar_meta(meta: MetaCreate, db: Session = Depends(get_db)):
    # Regra opcional: valor_atual não pode exceder o objetivo
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


@app.delete("/metas/{meta_id}", status_code=204)
def deletar_meta(meta_id: int, db: Session = Depends(get_db)):
    m = db.query(MetaTable).filter(MetaTable.id == meta_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meta não encontrada")
    db.delete(m)
    db.commit()
    return {}

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



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


# -------------------------
# Contas (CRUD)
# -------------------------
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


# -------------------------
# Recorrências (CRUD)
# -------------------------
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


# -------------------------
# Transações (CRUD + filtros + lógica de meta)
# -------------------------
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
            novo.conta_nome_cache = conta.nome

    # atualizar meta incremental
    if novo.meta_id and novo.alocado_valor:
        meta = db.query(MetaTable).filter(MetaTable.id == novo.meta_id).first()
        if meta:
            novo.meta_nome_cache = meta.titulo
            meta.valor_atual = (meta.valor_atual or 0.0) + novo.alocado_valor
            db.add(meta)

    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@app.get("/transacoes/{transacao_id}", response_model=TransacaoRead)
def buscar_transacao(transacao_id: int, db: Session = Depends(get_db)):
    t = db.query(Transacao).filter(Transacao.id == transacao_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return t


@app.patch("/transacoes/{transacao_id}", response_model=TransacaoRead)
def atualizar_transacao(transacao_id: int, payload: TransacaoUpdate, db: Session = Depends(get_db)):
    t = db.query(Transacao).filter(Transacao.id == transacao_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")

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
def deletar_transacao(transacao_id: int, db: Session = Depends(get_db)):
    t = db.query(Transacao).filter(Transacao.id == transacao_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
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
def gerar_fatura(conta_cartao_id: int, inicio: date, fim: date, db: Session = Depends(get_db)):
    inicio_dt = datetime.combine(inicio, datetime.min.time())
    fim_dt = datetime.combine(fim, datetime.max.time())

    transacoes = db.query(Transacao).filter(
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
    existente = db.query(UsuarioTable).filter(UsuarioTable.email == usuario.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    senha_hash = bcrypt.hash(usuario.senha)

    novo_usuario = UsuarioTable(
        nome=usuario.nome,
        email=usuario.email,
        senha=senha_hash,
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario


@app.get("/usuarios/", response_model=List[Usuario])
def listar_usuarios(db: Session = Depends(get_db)):
    """Lista todos os usuários cadastrados"""
    usuarios = db.query(UsuarioTable).all()
    return usuarios



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

