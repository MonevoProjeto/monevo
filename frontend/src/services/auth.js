
/**
 * Fazer login
 * Retorna: { sucesso: true/false, dados/erro }
 */
import { BASE_URL } from '@/api';


export const login = async (email, senha) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    
    if (!response.ok) {
      // try JSON first, then text
      let errBody = null;
      try { errBody = await response.json(); } catch (e) { /* ignore */ }
      if (errBody && errBody.detail) return { sucesso: false, erro: errBody.detail };
      const text = await response.text().catch(() => null);
      return { sucesso: false, erro: text || `Erro ao fazer login (${response.status})` };
    }
    
    const data = await response.json();
    
    // Guardar token e usuário no localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    
    return { sucesso: true, dados: data };
    
  } catch (error) {
    return { sucesso: false, erro: 'Erro de conexão' };
  }
};

/**
 * Criar nova conta
 */
export const registrar = async (nome, email, senha) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, email, senha })
    });
    
    if (!response.ok) {
      let errBody = null;
      try { errBody = await response.json(); } catch (e) { /* ignore */ }
      if (errBody && errBody.detail) return { sucesso: false, erro: errBody.detail };
      const text = await response.text().catch(() => null);
      return { sucesso: false, erro: text || `Erro ao criar conta (${response.status})` };
    }
    
    const data = await response.json();
    return { sucesso: true, dados: data };
    
  } catch (error) {
    return { sucesso: false, erro: 'Erro de conexão' };
  }
};

/**
 * Fazer logout
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
};

/**
 * Verificar se está logado
 */
export const estaLogado = () => {
  return localStorage.getItem('token') !== null;
};

/**
 * Pegar usuário atual
 */
export const getUsuario = () => {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
};

/**
 * Pegar token
 */
export const getToken = () => {
  return localStorage.getItem('token');
};
