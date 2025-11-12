/**
 * serviço de autenticação do front 
 * conversa com a API (auth/login e auth/registro)
 * guarda token JWT e o usuario logado no navegador (localStorage)
 * verifica se o usuario esta logado
 * permite recuperar o token e o usuario logado
 */


/**
 * Fazer login
 * Retorna: { sucesso: true/false, dados/erro }
 */
import { BASE_URL } from '@/api';

// FUNÇÃO LOGIN
//faz um POST para o backend (/auth/login), enviando o email e a senha que o usuario digitou
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
    // se o backend retornar um erro o codigo tenta ler o coro de resposta como JSON
    // se o back mandar 'detail', ele mostra pro usuario (ex: 'senha incorreta')
    // caso contrario, mostra um erro genérico
    const data = await response.json();
    
    // Guardar token e usuário no localStorage
    //sucesso no login
    localStorage.setItem('token', data.token); //salva o token JWT no navegador em texto 
    localStorage.setItem('usuario', JSON.stringify(data.usuario)); // salva o usuario logado como JSON
    //tudo isso fica persistente mesmo se refrescar a pagina ou fechar o navegador
    // o token é o que será enviado no Authorization: Bearer em todas as rotas protegidas (metas, perfil, etc)
    
    return { sucesso: true, dados: data };
    //retorna pro react se deu tudo certo ou não 
    
  } catch (error) {
    return { sucesso: false, erro: 'Erro de conexão' };
  }
};

/**
 * Criar nova conta
 * faz POST para /auth/registro com nome, email e senha
 * isso chama a rota do backend que cria o usuario
 *  "@app.post("/auth/registro)
 *  def registrar_usuario(...)"
 * 
 * 
 * DIFERENÇAS DO LOGIN 
 * não gera token (a API só cria o usuário)
 * apenas confirma o sucesso ou retorna o erro 
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
//limpa o token e os dados do usuario do localStorage
export const logout = () => {
  localStorage.removeItem('token'); 
  localStorage.removeItem('usuario');
};

/**
 * Verificar se está logado
 */
export const estaLogado = () => {
  return localStorage.getItem('token') !== null; //verifica se tem um token salvo no navegador
};

/**
 * Pegar usuário atual
 */
//retorna o usuario logado (objeto) ou null se ninguem estiver logado (id,nome,email, etc)
export const getUsuario = () => {
  const usuario = localStorage.getItem('usuario');
  return usuario ? JSON.parse(usuario) : null;
};

/**
 * Pegar token
 */
//retorna o token JWT atal 
// usado nos headers de requisições protegidas 

/** exemplo:
 * fetch(`${BASE_URL}/metas`, {
   headers: { 'Authorization': `Bearer ${getToken()}` }
});
 */

export const getToken = () => {
  return localStorage.getItem('token');
};


/** TEORIA
 * JWT --> token de autenticação assinado; prova de login --> salvo em localstorage
 * bearer token --> forma de enviar o JWT ao backend --> aparece em requisições autenticadas
 * localstorage  --> "memoria" do navegador; persiste mesmo ao recarregar a página --> usado para salvar tooken e usuario
 * statless auth --> o servidor não guarda sessão; só valida o token --> aparece na fastAPI + JWT
 */

/** FLUXO do login
 * usuario digita email e senha no front
 * ↓
 * front chama login() → envia email e senha para o backend (/auth/login)
 * ↓
 * backend valida as credenciais → devolve {token JWT, dados do usuario} ou erro
 * ↓
 * front salva token + usuario no localStorage
 * ↓
 * em todas as requisições, o token vai no header Authorization: Bearer <token> 
 */