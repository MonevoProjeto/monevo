from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth
import os

# Imports from your project structure
from database import get_db, UsuarioTable
from models import UsuarioCreate, UsuarioLogin, LoginResponse, Usuario
from auth import criar_hash_senha, verificar_senha, criar_token, pegar_usuario_atual

# Configuração do Router
router = APIRouter(prefix="/auth", tags=["Autenticação"])

from dotenv import load_dotenv
load_dotenv()

# --- CONFIGURAÇÃO GOOGLE OAUTH ---
# Certifique-se de que estas variáveis estão no seu .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
# URL para onde o Google vai devolver o usuário (deve ser igual ao console do Google)
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI") 
# URL do frontend para onde redirecionamos com o token final
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)
# ----------------------------------


@router.post("/registro", status_code=201)
def registrar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
    """
    Criar nova conta (Email/Senha)
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
    
    return {
        "mensagem": "Conta criada com sucesso! 🎉",
        "usuario": Usuario.from_orm(novo_usuario)
    }


@router.post("/login", response_model=LoginResponse)
def fazer_login(dados: UsuarioLogin, db: Session = Depends(get_db)):
    """
    Fazer login (Email/Senha)
    """
    # Buscar usuário
    usuario = db.query(UsuarioTable).filter(UsuarioTable.email == dados.email).first()
    
    if not usuario:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Verificar senha
    if not verificar_senha(dados.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Gerar token
    token = criar_token(usuario.id)
    
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
    Ver meu perfil (Rota Protegida)
    """
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
    Atualizar meu perfil (Rota Protegida)
    """
    usuario = db.query(UsuarioTable).filter(UsuarioTable.id == user_id).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if nome:
        usuario.nome = nome
    
    db.commit()
    db.refresh(usuario)
    return Usuario.from_orm(usuario)


# --- ROTAS GOOGLE OAUTH ---

@router.get("/google")
async def login_google(request: Request):
    """
    Inicia o fluxo de login com o Google.
    Redireciona o usuário para a página de consentimento do Google.
    """
    # O authorize_redirect cria a URL correta e envia o usuário para o Google
    return await oauth.google.authorize_redirect(request, REDIRECT_URI)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Recebe o código do Google, troca por token, cria/busca usuário e loga.
    """
    try:
        # 1. Troca o código de autorização pelo token de acesso
        token = await oauth.google.authorize_access_token(request)
        
        # 2. Obtém dados do usuário (depende do scope solicitado)
        user_info = token.get("userinfo")
        if not user_info:
            # Fallback se o userinfo não vier direto no token object
            user_info = await oauth.google.parse_id_token(request, token)

        email = user_info.get("email")
        nome = user_info.get("name", "Usuário Google")

        if not email:
             raise HTTPException(status_code=400, detail="Google não retornou o email")

        # 3. Verifica se o usuário já existe no banco
        usuario = db.query(UsuarioTable).filter(UsuarioTable.email == email).first()
        
        if not usuario:
            # Gera uma senha aleatória forte para cumprir o requisito de senha_hash do banco
            # O usuário Google nunca usará essa senha, ele loga via OAuth
            senha_aleatoria = os.urandom(16).hex()
            senha_hash = criar_hash_senha(senha_aleatoria)
            
            usuario = UsuarioTable(
                nome=nome, 
                email=email, 
                senha_hash=senha_hash,
                onboarding_step=0
            )
            db.add(usuario)
            db.commit()
            db.refresh(usuario)

        # 4. Cria nosso Token JWT interno (o mesmo usado no login padrão)
        jwt_token = criar_token(usuario.id)

        # 5. Redireciona para o Frontend com o token na URL
        # Ex: http://localhost:5173/auth/callback?token=xyz...
        redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
        
        return RedirectResponse(url=redirect_url)
    
    except Exception as e:
        # Logar o erro real em produção
        print(f"Erro no callback Google: {e}")
        redirect_error = f"{FRONTEND_URL}/auth/callback?error=autenticacao_falhou"
        return RedirectResponse(url=redirect_error)


@router.patch("/complete_onboarding")
def complete_onboarding(user_id: int = Depends(pegar_usuario_atual), db: Session = Depends(get_db)):
    """Marca o onboarding como concluído para o usuário autenticado."""
    usuario = db.query(UsuarioTable).filter(UsuarioTable.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    usuario.onboarding_step = 1
    db.add(usuario)
    db.commit()
    return {"ok": True}