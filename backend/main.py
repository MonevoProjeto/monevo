from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
import os

from models import Meta, MetaCreate
from database import get_db, MetaTable, create_tables, populate_initial_data

app = FastAPI(title="Monevo API", version="1.0.0")



@app.on_event("startup")
def on_startup():
    """Inicializa as tabelas e (localmente) popula dados de exemplo."""
    create_tables()
    populate_initial_data()
    if os.getenv("WEBSITE_INSTANCE_ID"):
        print("Executando no Azure App Service")
    else:
        print("Executando localmente")


# Base de dados temporária (em memória)
# metas_db = []
# next_id = 1


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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
