import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Any, Dict
import os

# Configuração do bcrypt (para hash de senhas)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Chave secreta para JWT (em produção, use Key Vault!)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "chave-super-secreta-mude-em-producao-123")
ALGORITHM = "HS256"
TOKEN_EXPIRATION_DAYS = 7

# Sistema de segurança HTTP Bearer
security = HTTPBearer()


def criar_hash_senha(senha: str) -> str:
    """
    Transforma senha em hash (liquidificador!)
    
    Exemplo:
    senha = "joao123"
    retorna = "$2b$12$abc..." (código gigante)
    """
    return pwd_context.hash(senha)


def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    """
    Verifica se senha está correta
    
    Exemplo:
    senha_plana = "joao123" (o que usuário digitou)
    senha_hash = "$2b$12$abc..." (o que está no banco)
    retorna = True ou False
    """
    return pwd_context.verify(senha_plana, senha_hash)


def criar_token(user_id: int) -> str:
    """
    Cria token JWT (ingresso digital)
    
    Exemplo:
    user_id = 1
    retorna = "eyJhbGci..." (token gigante)
    """
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=TOKEN_EXPIRATION_DAYS),
        'iat': datetime.utcnow()
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    return token


def verificar_token(token: str) -> Dict[str, Any]:
    """
    Valida token e retorna informações
    
    Se token inválido ou expirado, lança exceção
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado. Faça login novamente.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido.")


def pegar_usuario_atual(credentials: HTTPAuthorizationCredentials = Depends(security)) -> int:
    """
    Extrai user_id do token
    
    Esta função é usada como dependência do FastAPI:
    @app.get("/rota-protegida")
    def minha_rota(user_id: int = Depends(pegar_usuario_atual)):
        # user_id já vem automaticamente validado!
    """
    token = credentials.credentials
    payload = verificar_token(token)
    # Garantir que o payload contenha user_id
    try:
        return int(payload['user_id'])
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido: user_id ausente")