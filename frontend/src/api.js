// src/lib/api.js (ou onde você guarda seus serviços)

// 1) base URL por variável de ambiente (Vite)
//    crie um arquivo .env na raiz do front com:
//    VITE_API_URL=http://127.0.0.1:8000
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000';

// helper opcional p/ tratar resposta
async function handle(res) {
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `Erro HTTP ${res.status}`);
  }
  return res.json();
}

// GET /metas
export async function listarMetas() {
  try {
    const res = await fetch(`${BASE_URL}/metas`);
    return await handle(res);
  } catch (err) {
    console.error('Erro ao listar metas:', err);
    throw err;
  }
}

export const criarMeta = async (meta) => {
  try {
    // payload com campos normalizados
    const payload = {
      titulo: meta.titulo,
      descricao: meta.descricao ?? null,
      categoria: meta.categoria ?? "Outros", // ✅ define categoria padrão
      valor_objetivo: Number(meta.valor_objetivo),
      valor_atual: Number(meta.valor_atual ?? 0),
      prazo: meta.prazo ? String(meta.prazo) : null, // "YYYY-MM-DD" ou null
    };

    const response = await fetch("http://127.0.0.1:8000/metas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro:", errorText);
      throw new Error(`Erro ao criar meta (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error("Erro ao criar meta:", error);
    throw error;
  }
};
