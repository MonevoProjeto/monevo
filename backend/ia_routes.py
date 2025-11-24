from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, timedelta
from typing import List, Dict, Any
import os

from database import get_db, Transacao, MetaTable, Categoria, Conta
from auth import pegar_usuario_atual
from models_ia import (
    IaChatRequest, 
    IaChatResponse, 
    IaMetasRequest, 
    IaMetasResponse, 
    IaMetaSugerida
)

# Importar SDK do Gemini
import google.generativeai as genai

router = APIRouter(
    prefix="/ia",
    tags=["ia"]
)

# Configurar Gemini API
def get_gemini_model():
    """Retorna modelo Gemini configurado"""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="GEMINI_API_KEY não configurada no ambiente"
        )
    
    genai.configure(api_key=api_key)
    return genai.GenerativeModel('gemini-1.5-flash')

def obter_contexto_financeiro(user_id: int, db: Session) -> Dict[str, Any]:
    """
    Coleta dados financeiros do usuário para contexto da IA
    """
    # Obter transações dos últimos 30 dias
    data_limite = datetime.now() - timedelta(days=30)
    transacoes_recentes = db.query(Transacao).filter(
        Transacao.usuario_id == user_id,
        Transacao.data >= data_limite
    ).all()
    
    # Calcular totais por categoria
    gastos_por_categoria = {}
    receitas_total = 0
    despesas_total = 0
    
    for t in transacoes_recentes:
        if t.tipo == "receita":
            receitas_total += t.valor
        else:
            despesas_total += t.valor
            categoria_nome = t.categoria.nome if t.categoria else "Sem categoria"
            gastos_por_categoria[categoria_nome] = gastos_por_categoria.get(categoria_nome, 0) + t.valor
    
    # Obter metas ativas
    metas = db.query(MetaTable).filter(
        MetaTable.usuario_id == user_id,
        MetaTable.status == "ativa"
    ).all()
    
    metas_info = []
    for meta in metas:
        progresso = (meta.valor_atual / meta.valor_objetivo * 100) if meta.valor_objetivo > 0 else 0
        metas_info.append({
            "titulo": meta.titulo,
            "categoria": meta.categoria,
            "valor_objetivo": meta.valor_objetivo,
            "valor_atual": meta.valor_atual,
            "progresso_percentual": round(progresso, 2),
            "prazo": meta.prazo.strftime("%Y-%m-%d") if meta.prazo else None
        })
    
    # Obter saldo das contas
    contas = db.query(Conta).filter(Conta.usuario_id == user_id).all()
    saldo_total = sum(conta.saldo for conta in contas)
    
    return {
        "periodo_analise": "últimos 30 dias",
        "receitas_total": round(receitas_total, 2),
        "despesas_total": round(despesas_total, 2),
        "saldo_periodo": round(receitas_total - despesas_total, 2),
        "gastos_por_categoria": {k: round(v, 2) for k, v in gastos_por_categoria.items()},
        "saldo_total_contas": round(saldo_total, 2),
        "metas_ativas": metas_info,
        "numero_transacoes": len(transacoes_recentes)
    }

def formatar_prompt_financeiro(mensagem: str, contexto_financeiro: Dict[str, Any]) -> str:
    """
    Formata o prompt para o Gemini incluindo contexto financeiro
    """
    prompt = f"""Você é a IA Monevo, uma assistente financeira pessoal especializada em ajudar brasileiros a gerenciar suas finanças.

CONTEXTO FINANCEIRO DO USUÁRIO:
- Período de análise: {contexto_financeiro['periodo_analise']}
- Receitas totais: R$ {contexto_financeiro['receitas_total']:.2f}
- Despesas totais: R$ {contexto_financeiro['despesas_total']:.2f}
- Saldo do período: R$ {contexto_financeiro['saldo_periodo']:.2f}
- Saldo total em contas: R$ {contexto_financeiro['saldo_total_contas']:.2f}
- Número de transações: {contexto_financeiro['numero_transacoes']}

GASTOS POR CATEGORIA:
"""
    
    for categoria, valor in contexto_financeiro['gastos_por_categoria'].items():
        percentual = (valor / contexto_financeiro['despesas_total'] * 100) if contexto_financeiro['despesas_total'] > 0 else 0
        prompt += f"- {categoria}: R$ {valor:.2f} ({percentual:.1f}%)\n"
    
    if contexto_financeiro['metas_ativas']:
        prompt += "\nMETAS FINANCEIRAS ATIVAS:\n"
        for meta in contexto_financeiro['metas_ativas']:
            prompt += f"- {meta['titulo']} ({meta['categoria']}): R$ {meta['valor_atual']:.2f} / R$ {meta['valor_objetivo']:.2f} ({meta['progresso_percentual']:.1f}%)\n"
    else:
        prompt += "\nO usuário ainda não possui metas financeiras cadastradas.\n"
    
    prompt += f"""
PERGUNTA DO USUÁRIO:
{mensagem}

INSTRUÇÕES:
1. Responda em português brasileiro de forma clara e objetiva
2. Use os dados financeiros reais do usuário para dar conselhos personalizados
3. Seja empático e encorajador
4. Forneça dicas práticas e acionáveis
5. Quando relevante, sugira ajustes nas categorias de gastos ou metas
6. Use valores em reais (R$) quando mencionar dinheiro
7. Mantenha a resposta concisa (máximo 200 palavras)

RESPOSTA:
"""
    
    return prompt

@router.get("/ping")
def ia_ping(
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    """
    Endpoint de teste da IA.
    Verifica se a rota está funcionando e se a API key está configurada.
    """
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return {
                "ok": False, 
                "message": "GEMINI_API_KEY não configurada", 
                "user_id": user_id
            }
        
        return {
            "ok": True, 
            "message": "IA da Monevo ligada e configurada", 
            "user_id": user_id,
            "gemini_configured": True
        }
    except Exception as e:
        return {
            "ok": False, 
            "message": f"Erro ao verificar configuração: {str(e)}", 
            "user_id": user_id
        }

@router.post("/chat", response_model=IaChatResponse)
def chat_financeiro_ia(
    dados: IaChatRequest,
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db)
):
    """
    Endpoint de chat financeiro com IA Gemini.
    Analisa a pergunta do usuário e responde com base nos dados financeiros reais.
    """
    try:
        # 1. Obter contexto financeiro do usuário
        contexto_financeiro = obter_contexto_financeiro(user_id, db)
        
        # 2. Formatar prompt com contexto
        prompt = formatar_prompt_financeiro(dados.mensagem, contexto_financeiro)
        
        # 3. Chamar Gemini
        model = get_gemini_model()
        response = model.generate_content(prompt)
        
        # 4. Extrair resposta
        resposta_texto = response.text
        
        # 5. Gerar ações sugeridas (opcional, baseado em palavras-chave)
        acoes_sugeridas = []
        mensagem_lower = dados.mensagem.lower()
        
        if "economizar" in mensagem_lower or "poupar" in mensagem_lower:
            acoes_sugeridas.append("Criar meta de economia mensal")
            acoes_sugeridas.append("Revisar gastos por categoria")
        
        if "investir" in mensagem_lower or "investimento" in mensagem_lower:
            acoes_sugeridas.append("Analisar saldo disponível para investimento")
            acoes_sugeridas.append("Definir percentual de investimento mensal")
        
        if "dívida" in mensagem_lower or "divida" in mensagem_lower:
            acoes_sugeridas.append("Listar todas as dívidas com juros")
            acoes_sugeridas.append("Criar plano de quitação")
        
        return IaChatResponse(
            resposta=resposta_texto,
            acoes_sugeridas=acoes_sugeridas if acoes_sugeridas else None,
            debug=None  # Em produção, não enviar debug
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Log do erro (em produção, usar logging adequado)
        print(f"Erro no chat IA: {str(e)}")
        
        return IaChatResponse(
            resposta="Desculpe, não consegui processar sua pergunta no momento. Por favor, tente novamente em alguns instantes.",
            acoes_sugeridas=None,
            debug={"erro": str(e)} if os.getenv("DEBUG") else None
        )

@router.post("/metas/sugerir", response_model=IaMetasResponse)
def sugerir_metas_ia(
    dados: IaMetasRequest,
    user_id: int = Depends(pegar_usuario_atual),
    db: Session = Depends(get_db),
):
    """
    Sugere metas financeiras personalizadas usando IA Gemini.
    Analisa o perfil financeiro do usuário e gera recomendações.
    """
    try:
        # 1. Obter contexto financeiro
        contexto_financeiro = obter_contexto_financeiro(user_id, db)
        
        # 2. Montar prompt para sugestão de metas
        prompt = f"""Você é a IA Monevo, especialista em planejamento financeiro pessoal.

CONTEXTO FINANCEIRO DO USUÁRIO:
- Receitas mensais: R$ {contexto_financeiro['receitas_total']:.2f}
- Despesas mensais: R$ {contexto_financeiro['despesas_total']:.2f}
- Saldo disponível: R$ {contexto_financeiro['saldo_total_contas']:.2f}
- Metas atuais: {len(contexto_financeiro['metas_ativas'])}

OBJETIVO DO USUÁRIO: {dados.objetivo_principal or 'Melhorar saúde financeira geral'}
HORIZONTE: {dados.horizonte_meses or 6} meses

TAREFA:
Sugira 2-3 metas financeiras SMART (específicas, mensuráveis, atingíveis, relevantes e temporais) para este usuário.

Para cada meta, forneça:
1. Título conciso (máximo 50 caracteres)
2. Descrição breve (máximo 100 caracteres)
3. Categoria (escolha entre: Reserva, Investimento, Quitar Dívida, Economia, Compra)
4. Valor objetivo em reais
5. Prazo em meses
6. 2-3 passos práticos semanais

FORMATO DE RESPOSTA (JSON):
{{
  "metas": [
    {{
      "titulo": "...",
      "descricao": "...",
      "categoria": "...",
      "valor_objetivo": 0.00,
      "prazo_meses": 0,
      "passos_semanais": ["...", "..."]
    }}
  ],
  "resumo_plano": "..."
}}

Seja realista com os valores e prazos considerando a renda do usuário.
"""
        
        # 3. Chamar Gemini
        model = get_gemini_model()
        response = model.generate_content(prompt)
        
        # 4. Parsear resposta JSON
        import json
        import re
        
        # Extrair JSON da resposta (pode vir com markdown)
        texto_resposta = response.text
        json_match = re.search(r'\{.*\}', texto_resposta, re.DOTALL)
        
        if json_match:
            dados_json = json.loads(json_match.group())
            
            metas_sugeridas = []
            for meta_data in dados_json.get("metas", []):
                metas_sugeridas.append(IaMetaSugerida(
                    titulo=meta_data.get("titulo", "Meta Sugerida"),
                    descricao=meta_data.get("descricao"),
                    categoria=meta_data.get("categoria"),
                    valor_objetivo=meta_data.get("valor_objetivo"),
                    prazo_meses=meta_data.get("prazo_meses"),
                    passos_semanais=meta_data.get("passos_semanais")
                ))
            
            return IaMetasResponse(
                metas=metas_sugeridas,
                resumo_plano=dados_json.get("resumo_plano", "Plano personalizado gerado pela IA")
            )
        else:
            # Fallback: criar meta genérica
            raise ValueError("Não foi possível parsear resposta da IA")
            
    except Exception as e:
        print(f"Erro ao sugerir metas: {str(e)}")
        
        # Fallback: retornar meta genérica baseada no contexto
        contexto_financeiro = obter_contexto_financeiro(user_id, db)
        saldo_disponivel = contexto_financeiro['saldo_total_contas']
        
        meta_generica = IaMetaSugerida(
            titulo="Construir Reserva de Emergência",
            descricao="Criar poupança equivalente a 3 meses de despesas",
            categoria="Reserva",
            valor_objetivo=contexto_financeiro['despesas_total'] * 3,
            prazo_meses=dados.horizonte_meses or 6,
            passos_semanais=[
                "Guardar 10% da renda mensal",
                "Reduzir gastos supérfluos",
                "Automatizar transferência para poupança"
            ]
        )
        
        return IaMetasResponse(
            metas=[meta_generica],
            resumo_plano="Meta sugerida com base no seu perfil financeiro. Configure a API do Gemini para recomendações mais personalizadas."
        )
