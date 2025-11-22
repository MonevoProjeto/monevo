import logging

from azure.functions import TimerRequest
from datetime import datetime, timezone


def main(mytimer: TimerRequest) -> None:
    utc_timestamp = datetime.utcnow().replace(tzinfo=timezone.utc).isoformat()

    if mytimer.past_due:
        logging.info('The timer is past due!')

    logging.info('Python timer trigger function ran at %s', utc_timestamp)

import logging
import azure.functions as func
import pyodbc
import os
from datetime import datetime

def main(mytimer: func.TimerRequest) -> None:
    utc_timestamp = datetime.utcnow().isoformat()
    logging.info(f'🚀 Função de Monitoramento iniciada em: {utc_timestamp}')
    
    # Pega a string de conexão das variáveis de ambiente do Azure
    conn_str = os.environ["DATABASE_CONNECTION_STRING"]

    conn = None
    try:
        # Conecta ao banco
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Executa a verificação principal
        verificar_orcamentos(cursor)
        
        conn.commit()
        logging.info('✅ Monitoramento concluído com sucesso!')
        
    except Exception as e:
        logging.error(f'❌ Erro na execução: {str(e)}')
        if conn: conn.rollback()
    finally:
        if conn: conn.close()

def verificar_orcamentos(cursor):
    """
    Compara o 'valor_limite' definido no Onboarding (tabela orcamentos)
    com o total gasto no mês atual (tabela transacoes).
    """
    logging.info('📊 Verificando orçamentos mensais...')

    # Esta query faz o "match" entre o orçamento definido e as transações do mês
    query = """
        SELECT 
            o.usuario_id,
            o.categoria_chave,
            o.valor_limite,
            ISNULL(SUM(t.valor), 0) as total_gasto
        FROM orcamentos o
        -- Relaciona orçamento com transações do mesmo usuário
        LEFT JOIN transacoes t ON 
            t.usuario_id = o.usuario_id 
            -- Tenta cruzar pela chave da categoria (ex: 'mercado') que salvamos no onboarding
            -- Ajuste isso se sua transacao usa apenas ID, mas aqui assumimos que podemos cruzar chaves ou IDs
            AND (
                t.categoria_cache = o.categoria_chave 
                OR 
                t.categoria_id = o.categoria_id
            )
            AND t.tipo = 'despesa'
            AND MONTH(t.data) = MONTH(GETDATE())
            AND YEAR(t.data) = YEAR(GETDATE())
        WHERE o.ativo = 1
        GROUP BY o.usuario_id, o.categoria_chave, o.valor_limite
    """
    
    cursor.execute(query)
    resultados = cursor.fetchall()
    
    for linha in resultados:
        usuario_id, categoria, limite, gasto = linha
        
        # Evita divisão por zero
        if limite <= 0: 
            continue
            
        percentual = (float(gasto) / float(limite)) * 100
        
        # Regra 1: Estourou o orçamento (>= 100%)
        if percentual >= 100:
            criar_notificacao(
                cursor, 
                usuario_id, 
                'orcamento_estourado', 
                f'🚨 Limite de {categoria.capitalize()} excedido! Gasto: R$ {gasto:.2f} / Limite: R$ {limite:.2f}'
            )
        
        # Regra 2: Alerta de perigo (>= 80%)
        elif percentual >= 80:
            criar_notificacao(
                cursor, 
                usuario_id, 
                'orcamento_alerta', 
                f'⚠️ Atenção: Você já consumiu {percentual:.0f}% do orçamento de {categoria.capitalize()}.'
            )

def criar_notificacao(cursor, usuario_id, tipo, mensagem):
    """
    Insere o alerta na tabela 'notificacoes' para o Frontend ler depois.
    Evita duplicar o mesmo aviso se já foi enviado nas últimas 24h.
    """
    
    # Define um título bonitinho baseado no tipo
    titulo = "Aviso Financeiro"
    if tipo == 'orcamento_estourado':
        titulo = "Orçamento Estourado"
    elif tipo == 'orcamento_alerta':
        titulo = "Alerta de Gastos"

    # Verifica se já avisamos isso hoje (para não floodar o usuário)
    check_query = """
        SELECT id FROM notificacoes 
        WHERE usuario_id = ? 
          AND tipo = ? 
          AND mensagem = ? 
          AND created_at > DATEADD(hour, -24, GETDATE())
    """
    cursor.execute(check_query, (usuario_id, tipo, mensagem))
    
    if cursor.fetchone():
        logging.info(f'⏭️ Notificação duplicada ignorada para user {usuario_id}')
        return

    # Insere a notificação
    insert_query = """
        INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida, created_at)
        VALUES (?, ?, ?, ?, 0, GETDATE())
    """
    cursor.execute(insert_query, (usuario_id, tipo, titulo, mensagem))
    logging.info(f'📬 Notificação criada para user {usuario_id}: {titulo}')