// src/lib/api.js - API para comunicação com backend

// Base URL da API
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
console.log('[API] BASE_URL =', BASE_URL);
export { BASE_URL };

/**
 * Função helper para fazer requisições com token automático
 */
const fetchComAuth = async (url, options = {}) => {
  // Pegar token do localStorage
  const token = localStorage.getItem('token');

  // Adicionar token no header se existir
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // Se retornar 401 (não autorizado), fazer logout automático
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  return response;
};

// Nota: a variável VITE_API_URL deve ser definida em um arquivo .env (ex: frontend/.env.production)
// Exemplo (não executar em JS):
// VITE_API_URL='https://monevobackend-a7f8etedfze0atg6.centralus-01.azurewebsites.net'


// Helper para tratar respostas
async function handleResponse(res) {
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

 
// GET /transacoes - listar transacoes com query params simples
export async function listarTransacoes(params = {}) {
  try {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      // Dates should be ISO strings
      if (v instanceof Date) qs.append(k, v.toISOString());
      else qs.append(k, String(v));
    });
    const relativeUrl = `/transacoes${qs.toString() ? `?${qs.toString()}` : ''}`;
    const response = await fetchComAuth(relativeUrl);
    return await handleResponse(response);
  } catch (err) {
    console.error('Erro ao listar transações:', err);
    throw err;
  }
}

// POST /transacoes - criar nova transacao (usa token do usuário)
export async function criarTransacao(payload) {
  try {
    const response = await fetchComAuth('/transacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch (err) {
    console.error('Erro ao criar transação:', err);
    throw err;
  }
}


// GET /metas - Listar todas as metas
export async function listarMetas() {
  try {
    const response = await fetchComAuth('/metas');
    return await handleResponse(response);
  } catch (err) {
    console.error('Erro ao listar metas:', err);
    throw err;
  }
}

// POST /metas - Criar nova meta
export const criarMeta = async (meta) => {
  try {
    const payload = {
      titulo: meta.titulo,
      descricao: meta.descricao || null,
      categoria: meta.categoria || "Outros",
      valor_objetivo: Number(meta.valor_objetivo),
      valor_atual: Number(meta.valor_atual || 0),
      prazo: meta.prazo ? String(meta.prazo) : null,
    };

    const response = await fetchComAuth('/metas', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    throw error;
  }
};

// GET /metas/{id} - Buscar meta específica
export async function buscarMeta(metaId) {
  try {
    const response = await fetchComAuth(`/metas/${metaId}`);
    return await handleResponse(response);
  } catch (err) {
    console.error('Erro ao buscar meta:', err);
    throw err;
  }
}

// PUT /metas/{id} - Atualizar meta
export async function atualizarMeta(metaId, meta) {
  try {
    const payload = {
      titulo: meta.titulo,
      descricao: meta.descricao || null,
      categoria: meta.categoria || "Outros",
      valor_objetivo: Number(meta.valor_objetivo),
      valor_atual: Number(meta.valor_atual || 0),
      prazo: meta.prazo ? String(meta.prazo) : null,
    };

    const response = await fetchComAuth(`/metas/${metaId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return await handleResponse(response);
  } catch (error) {
    console.error("Erro ao atualizar meta:", error);
    throw error;
  }
}

// DELETE /metas/{id} - Deletar meta
export async function deletarMeta(metaId) {
  try {
    const response = await fetchComAuth(`/metas/${metaId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar meta (${response.status})`);
    }

    return true;
  } catch (error) {
    console.error("Erro ao deletar meta:", error);
    throw error;
  }
}


// ============ PERFIL ============

export const carregarPerfil = async () => {
  try {
    // O endpoint /perfil (do main.py) retorna os dados do onboarding
    const response = await fetchComAuth('/perfil');
    if (!response.ok) throw new Error('Erro ao buscar perfil');
    return await response.json();
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
};

// Mantemos compatibilidade com nomes antigos usados no código
export const buscarPerfil = carregarPerfil;

// MODIFICADO: Renomeado de 'salvarPerfil' para 'atualizarPerfil' para consistência
export const atualizarPerfil = async (payload) => {
  // 'payload' deve ser o objeto OnboardingUpdate (ex: { step1: {...}, step2: {...} })
  try {
    const response = await fetchComAuth('/perfil', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return await handleResponse(response);
  } catch (err) {
    console.error('Erro ao salvar perfil:', err);
    throw err;
  }
};

// Compatibilidade com nome antigo
export const salvarPerfil = atualizarPerfil;

// POST /onboarding - cria usuário + perfil e retorna token
export const submitOnboarding = async (payload) => {
  try {
    const response = await fetch(`${BASE_URL}/onboarding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch (err) {
    console.error('Erro ao submeter onboarding:', err);
    throw err;
  }
};
