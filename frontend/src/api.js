// src/lib/api.js - API para comunicação com backend

// Base URL da API
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';
console.log('[API] BASE_URL =', BASE_URL); // <-- ADICIONE
export { BASE_URL }; // <-- ADICIONE


// Helper para tratar respostas
async function handleResponse(res) {
  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(errorText || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

// GET /metas - Listar todas as metas
export async function listarMetas() {
  try {
    const response = await fetch(`${BASE_URL}/metas`);
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

    const response = await fetch(`${BASE_URL}/metas`, {
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
    const response = await fetch(`${BASE_URL}/metas/${metaId}`);
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

    const response = await fetch(`${BASE_URL}/metas/${metaId}`, {
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
    const response = await fetch(`${BASE_URL}/metas/${metaId}`, {
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
