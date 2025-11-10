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
    """
    Function que verifica orçamentos e cria notificações.
    Roda automaticamente de acordo com o schedule configurado.
    """
    utc_timestamp = datetime.utcnow().isoformat()
    
    # Verifica se a execução está atrasada
    if mytimer.past_due:
        logging.info('⏰ O timer está atrasado!')
    
    logging.info(f'🚀 Iniciando verificação de orçamentos em: {utc_timestamp}')
    
    # Conectar ao SQL Server
    try:
        conn = pyodbc.connect(os.environ["DATABASE_CONNECTION_STRING"])
        cursor = conn.cursor()
        
        # Verificar cada tipo de orçamento
        verificar_orcamentos_mensais(cursor)
        verificar_orcamentos_trimestrais(cursor)
        verificar_orcamentos_anuais(cursor)
        
        # Salvar todas as mudanças
        conn.commit()
        logging.info('✅ Verificação concluída com sucesso!')
        
    except Exception as e:
        logging.error(f'❌ Erro na verificação: {str(e)}')
        if conn:
            conn.rollback()
        raise  # Re-lança o erro para o Azure registrar
    finally:
        # Sempre fechar conexões
        if cursor:
            cursor.close()
        if conn:
            conn.close()


def verificar_orcamentos_mensais(cursor):
    """Verifica orçamentos mensais de todos os usuários"""
    logging.info('📅 Verificando orçamentos mensais...')
    
    # Query que busca orçamentos e soma gastos do mês atual
    query = """
        SELECT 
            o.id,
            o.user_id,
            o.categoria_id,
            o.valor_limite,
            c.nome as categoria_nome,
            ISNULL(SUM(t.valor), 0) as total_gasto
        FROM orcamentos o
        LEFT JOIN categorias c ON o.categoria_id = c.id
        LEFT JOIN transacoes t ON t.user_id = o.user_id 
            AND t.categoria_id = o.categoria_id
            AND t.tipo = 'despesa'
            AND DATEPART(year, t.data) = DATEPART(year, GETDATE())
            AND DATEPART(month, t.data) = DATEPART(month, GETDATE())
        WHERE o.periodo = 'mensal'
            AND o.ativo = 1
        GROUP BY o.id, o.user_id, o.categoria_id, o.valor_limite, c.nome
    """
    
    cursor.execute(query)
    orcamentos = cursor.fetchall()
    
    logging.info(f'📊 Encontrados {len(orcamentos)} orçamentos mensais')
    
    for orc in orcamentos:
        orc_id, user_id, cat_id, limite, cat_nome, gasto = orc
        
        # Calcular percentual usado
        percentual = (float(gasto) / float(limite) * 100) if float(limite) > 0 else 0
        
        # Criar notificação se necessário
        if percentual >= 80 and percentual < 100:
            # Alerta: 80% ou mais do orçamento
            criar_notificacao(
                cursor, user_id, 'orcamento_alerta',
                f'⚠️ Atenção! Você já gastou {percentual:.0f}% do orçamento mensal de {cat_nome}'
            )
        
        elif percentual >= 100:
            # Orçamento estourado
            criar_notificacao(
                cursor, user_id, 'orcamento_estourado',
                f'🚨 Orçamento mensal de {cat_nome} estourado! Você gastou R$ {float(gasto):.2f} de R$ {float(limite):.2f}'
            )


def verificar_orcamentos_trimestrais(cursor):
    """Verifica orçamentos trimestrais de todos os usuários"""
    logging.info('📅 Verificando orçamentos trimestrais...')
    
    query = """
        SELECT 
            o.id,
            o.user_id,
            o.categoria_id,
            o.valor_limite,
            c.nome as categoria_nome,
            ISNULL(SUM(t.valor), 0) as total_gasto
        FROM orcamentos o
        LEFT JOIN categorias c ON o.categoria_id = c.id
        LEFT JOIN transacoes t ON t.user_id = o.user_id 
            AND t.categoria_id = o.categoria_id
            AND t.tipo = 'despesa'
            AND DATEPART(year, t.data) = DATEPART(year, GETDATE())
            AND DATEPART(quarter, t.data) = DATEPART(quarter, GETDATE())
        WHERE o.periodo = 'trimestral'
            AND o.ativo = 1
        GROUP BY o.id, o.user_id, o.categoria_id, o.valor_limite, c.nome
    """
    
    cursor.execute(query)
    orcamentos = cursor.fetchall()
    
    logging.info(f'📊 Encontrados {len(orcamentos)} orçamentos trimestrais')
    
    for orc in orcamentos:
        orc_id, user_id, cat_id, limite, cat_nome, gasto = orc
        percentual = (float(gasto) / float(limite) * 100) if float(limite) > 0 else 0
        
        if percentual >= 80 and percentual < 100:
            criar_notificacao(
                cursor, user_id, 'orcamento_alerta',
                f'⚠️ Atenção! Você já gastou {percentual:.0f}% do orçamento trimestral de {cat_nome}'
            )
        elif percentual >= 100:
            criar_notificacao(
                cursor, user_id, 'orcamento_estourado',
                f'🚨 Orçamento trimestral de {cat_nome} estourado!'
            )


def verificar_orcamentos_anuais(cursor):
    """Verifica orçamentos anuais de todos os usuários"""
    logging.info('📅 Verificando orçamentos anuais...')
    
    query = """
        SELECT 
            o.id,
            o.user_id,
            o.categoria_id,
            o.valor_limite,
            c.nome as categoria_nome,
            ISNULL(SUM(t.valor), 0) as total_gasto
        FROM orcamentos o
        LEFT JOIN categorias c ON o.categoria_id = c.id
        LEFT JOIN transacoes t ON t.user_id = o.user_id 
            AND t.categoria_id = o.categoria_id
            AND t.tipo = 'despesa'
            AND DATEPART(year, t.data) = DATEPART(year, GETDATE())
        WHERE o.periodo = 'anual'
            AND o.ativo = 1
        GROUP BY o.id, o.user_id, o.categoria_id, o.valor_limite, c.nome
    """
    
    cursor.execute(query)
    orcamentos = cursor.fetchall()
    
    logging.info(f'📊 Encontrados {len(orcamentos)} orçamentos anuais')
    
    for orc in orcamentos:
        orc_id, user_id, cat_id, limite, cat_nome, gasto = orc
        percentual = (float(gasto) / float(limite) * 100) if float(limite) > 0 else 0
        
        if percentual >= 80 and percentual < 100:
            criar_notificacao(
                cursor, user_id, 'orcamento_alerta',
                f'⚠️ Atenção! Você já gastou {percentual:.0f}% do orçamento anual de {cat_nome}'
            )
        elif percentual >= 100:
            criar_notificacao(
                cursor, user_id, 'orcamento_estourado',
                f'🚨 Orçamento anual de {cat_nome} estourado!'
            )


def criar_notificacao(cursor, user_id, tipo, mensagem):
    """
    Cria uma notificação no banco de dados.
    Evita duplicatas verificando se já existe notificação similar não lida.
    """
    
    # Verificar se já existe notificação similar nas últimas 24h
    cursor.execute("""
        SELECT id FROM notificacoes 
        WHERE user_id = ? 
            AND tipo = ?
            AND mensagem = ?
            AND lida = 0
            AND created_at > DATEADD(hour, -24, GETDATE())
    """, (user_id, tipo, mensagem))
    
    if cursor.fetchone():
        logging.info(f'⏭️ Notificação duplicada ignorada para user {user_id}')
        return
    
    # Inserir nova notificação
    cursor.execute("""
        INSERT INTO notificacoes (user_id, tipo, mensagem, lida, created_at)
        VALUES (?, ?, ?, 0, GETDATE())
    """, (user_id, tipo, mensagem))
    
    logging.info(f'📬 Notificação criada para user {user_id}: {mensagem}')