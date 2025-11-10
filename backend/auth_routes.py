from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db, UsuarioTable
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
    
    # Criar usuário no banco (não armazenamos 'curso' no modelo atual)
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
    
    db.commit()
    db.refresh(usuario)
    
