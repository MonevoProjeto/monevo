import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Any, Dict
import os

"""
hash = função que transforma um texto em um codigo irreversivel
salt = valor aleatorio adicionado a senha antes de gerar o hash, para aumentar a segurança
bcrypt = algoritmo de hash sde senha lento de proposito (dificulta força bruta) e ja inclui salt 


O usuário faz login uma vez, recebe um token digital, e usa esse token para acessar todas as rotas protegidas depois
"""

# Configuração do bcrypt (para hash de senhas)
#configura o passlib para usar bcrypt 
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Chave secreta para JWT (em produção, use Key Vault!)
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "chave-super-secreta-mude-em-producao-123")
ALGORITHM = "HS256"
TOKEN_EXPIRATION_DAYS = 7

# Sistema de segurança HTTP Bearer
security = HTTPBearer()

#recebe a senha e devolve com o hash que voce salva no banco 
def criar_hash_senha(senha: str) -> str:
    """
    Transforma senha em hash (liquidificador!)
    
    Exemplo:
    senha = "joao123"
    retorna = "$2b$12$abc..." (código gigante)
    """
    return pwd_context.hash(senha)

# compara o que o usuario digitiou com o hash salvo 
def verificar_senha(senha_plana: str, senha_hash: str) -> bool:
    """
    Verifica se senha está correta
    
    Exemplo:
    senha_plana = "joao123" (o que usuário digitou)
    senha_hash = "$2b$12$abc..." (o que está no banco)
    retorna = True ou False
    """
    return pwd_context.verify(senha_plana, senha_hash)

"""
JWT = JSON Web Token = string com 3 partes
- header: algoritmo (ex.: "alg":"HS256").
- payload: dados (claims), ex.: {"user_id": 42, "exp": 173... }.
- signature: assinatura (HMAC-SHA256) com sua SECRET_KEY.

o servidor nao guarda sessao: so confere assinatura e a expiração toda vez que recebe o token 

"""
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
    token = credentials.credentials #extrai o token do header
    payload = verificar_token(token) #valida assinatura/expiração
    # Garantir que o payload contenha user_id
    try:
        return int(payload['user_id']) #devolve o id 
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido: user_id ausente")
    

"""
passo a passo 

etapa 1: cadastro 
1. Usuário envia nome, e-mail e senha.
2. O backend pega a senha e passa pelo bcrypt → gera um hash.
3. Salva o hash no banco (e nunca a senha real).

etapa 2: login
1. Usuário digita e-mail e senha.
2. O backend pega a senha digitada e compara com o hash do banco usando verificar_senha().
3. Se der certo → o backend gera um token JWT:
    - contém o user_id dentro dele;
    - tem uma data de expiração (7 dias);
    - é assinado com uma chave secreta.

o token é um ingresso assinado, provando que esta auteniado 

etapa 3: acessar rotas protegidas
1. O frontend guarda o token (localStorage, por exemplo).
2. Quando faz uma requisição, envia o token no header:
    Authorization: Bearer <token>
3. O backend (com o Depends(security)) valida:
    - se o token não expirou;
    - se a assinatura é verdadeira;
    - se contém um user_id.
4. Se estiver tudo certo, a rota é liberada e o user_id é recuperado automaticamente.
"""