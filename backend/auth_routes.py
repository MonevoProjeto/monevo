from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models_db import UsuarioTable
from database import get_db
from models import UsuarioCreate, UsuarioLogin, LoginResponse, Usuario
from auth import criar_hash_senha, verificar_senha, criar_token, pegar_usuario_atual

# publica as rotas de registro, login e perfil; usa bcrypt para proteger senhas, 
# JWT para autenticar requisição e depends para garantir que só quem tem token valido acesse as rotas 

# HTTP Bearer + Depends: o FastAPI usa HTTPBearer para pegar o token do header e Depends para “plugá-lo” nas rotas. 
# Se o token é inválido/expirou, a rota nem roda.
router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/registro", status_code=201)
def registrar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Criar nova conta
    
    Processo:
    1. Verifica se email já existe
    2. Cria hash da senha (segurança!)
    3. Salva no banco
    4. Retorna sucesso
    """
    # Verificar se email já existe
    usuario_existe = db.query(UsuarioTable).filter(UsuarioTable.email == dados.email).first()
    if usuario_existe:
        raise HTTPException(status_code=400, detail="Este email já está cadastrado")
    
    # Criar hash da senha
    senha_hash = criar_hash_senha(dados.senha)
    
    # Criar usuário no banco
    novo_usuario = UsuarioTable(
        nome=dados.nome,
        email=dados.email,
        senha_hash=senha_hash
    )
    
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    
    # Converter para modelo Pydantic (sem senha!)
    return {
        "mensagem": "Conta criada com sucesso! 🎉",
        "usuario": Usuario.from_orm(novo_usuario)
    }


@router.post("/login", response_model=LoginResponse)
def fazer_login(dados: UsuarioLogin, db: Session = Depends(get_db)):
    """
    Fazer login
    
    Processo:
    1. Busca usuário pelo email
    2. Verifica se senha está correta
    3. Gera token JWT
    4. Retorna token + dados do usuário
    """
    # Buscar usuário
    usuario = db.query(UsuarioTable).filter(UsuarioTable.email == dados.email).first()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Verificar senha
    if not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Gerar token 
    token = criar_token(
        user_id=usuario.id,
        nome=usuario.nome,
        email=usuario.email
    )
    
    return {
        "token": token,
        "usuario": Usuario.from_orm(usuario)
    }


@router.get("/me", response_model=Usuario)
def meu_perfil(
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    """
    Ver meu perfil
    
    ROTA PROTEGIDA: precisa de token!
    """
    # Buscar usuário
    usuario = db.query(UsuarioTable).filter(UsuarioTable.id == user_id).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return Usuario.from_orm(usuario)


@router.put("/me", response_model=Usuario)
def atualizar_perfil(
    nome: str = None,
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    """
    Atualizar meu perfil
    
    ROTA PROTEGIDA: precisa de token!
    """
    usuario = db.query(UsuarioTable).filter(UsuarioTable.id == user_id).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Atualizar apenas campos enviados
    if nome:
        usuario.nome = nome
    
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    
    return Usuario.from_orm(usuario)

from fastapi.responses import RedirectResponse
from fastapi import Request, Depends, HTTPException
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
import os

from models_db import UsuarioTable
from database import get_db
from auth import criar_token  # ajuste o import conforme onde a função estiver no seu projeto

# Configuração do OAuth Google
oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

# URLs do .env
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL")

@router.get("/google")
async def login_google(request: Request):
    """Inicia o login com o Google"""
    return await oauth.google.authorize_redirect(request, REDIRECT_URI)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Callback do Google OAuth"""
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")

    if not user_info:
        raise HTTPException(status_code=400, detail="Erro ao autenticar com o Google")

    email = user_info["email"]
    nome = user_info.get("name", "Usuário Google")

    # Verifica se o usuário já existe no banco
    usuario = db.query(UsuarioTable).filter(UsuarioTable.email == email).first()
    if not usuario:
        usuario = UsuarioTable(nome=nome, email=email, senha_hash="")
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    # Cria token JWT
    jwt_token = criar_token(user_id=usuario.id, nome=usuario.nome, email=usuario.email)

    # Redireciona o usuário de volta ao frontend com o token
    redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
    return RedirectResponse(url=redirect_url)
