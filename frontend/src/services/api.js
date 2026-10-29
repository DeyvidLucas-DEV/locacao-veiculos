const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';
const CHAVE_TOKEN = 'locadora:token';

let aoExpirarSessao = () => {};

export function definirAcaoDeSessaoExpirada(acao) {
  aoExpirarSessao = acao;
}

export function obterToken() {
  return localStorage.getItem(CHAVE_TOKEN);
}

export function salvarToken(token) {
  localStorage.setItem(CHAVE_TOKEN, token);
}

export function removerToken() {
  localStorage.removeItem(CHAVE_TOKEN);
}

async function requisitar(caminho, { metodo = 'GET', corpo } = {}) {
  const token = obterToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers,
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new Error('Não foi possível conectar ao servidor. Verifique se a API está em execução.');
  }

  const dados = await resposta.json().catch(() => null);

  if (resposta.status === 401 && token) {
    aoExpirarSessao(dados?.erro);
  }
  if (!resposta.ok) {
    throw new Error(dados?.erro || 'Não foi possível concluir a operação.');
  }

  return dados;
}

export const authApi = {
  registrar: (dados) => requisitar('/auth/register', { metodo: 'POST', corpo: dados }),
  login: (dados) => requisitar('/auth/login', { metodo: 'POST', corpo: dados }),
  usuarioAtual: () => requisitar('/auth/me'),
};

export const veiculosApi = {
  listar: () => requisitar('/veiculos'),
  listarDisponiveis: () => requisitar('/veiculos/disponiveis'),
  cadastrar: (dados) => requisitar('/veiculos', { metodo: 'POST', corpo: dados }),
};

export const locacoesApi = {
  listar: () => requisitar('/locacoes'),
  registrar: (dados) => requisitar('/locacoes', { metodo: 'POST', corpo: dados }),
  finalizar: (id) => requisitar(`/locacoes/${id}/finalizar`, { metodo: 'PATCH' }),
};
