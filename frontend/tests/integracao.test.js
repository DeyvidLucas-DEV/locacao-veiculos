import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const armazenamento = new Map();
globalThis.localStorage = {
  getItem: (chave) => armazenamento.get(chave) ?? null,
  setItem: (chave, valor) => armazenamento.set(chave, String(valor)),
  removeItem: (chave) => armazenamento.delete(chave),
};

process.env.VITE_API_URL ||= 'http://localhost:3334/api';

let vite;
let api;

before(async () => {
  vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' });
  api = await vite.ssrLoadModule('/src/services/api.js');
});

after(() => vite.close());

test('frontend executa o fluxo completo usando a API real', async () => {
  const sufixo = Date.now();
  const email = `integracao${sufixo}@teste.com`;
  const placa = `INT${String(sufixo).slice(-4)}`;

  await api.authApi.registrar({ nome: 'Teste Integração', email, senha: 'senha123' });
  const sessao = await api.authApi.login({ email, senha: 'senha123' });
  api.salvarToken(sessao.token);

  const usuario = await api.authApi.usuarioAtual();
  assert.equal(usuario.email, email);

  const veiculo = await api.veiculosApi.cadastrar({
    marca: 'Nissan',
    modelo: 'Kicks',
    placa,
    ano: 2024,
    valorDiaria: '200.00',
  });
  const disponiveis = await api.veiculosApi.listarDisponiveis();
  assert.ok(disponiveis.some((item) => item.id === veiculo.id));

  const locacao = await api.locacoesApi.registrar({
    veiculoId: veiculo.id,
    dataInicio: '2026-12-01T10:00:00.000Z',
    dataPrevistaDevolucao: '2026-12-03T12:00:00.000Z',
  });
  assert.equal(Number(locacao.valorTotal), 600);

  await assert.rejects(
    api.locacoesApi.registrar({
      veiculoId: veiculo.id,
      dataInicio: '2026-12-05T10:00:00.000Z',
      dataPrevistaDevolucao: '2026-12-06T10:00:00.000Z',
    }),
    /indisponível/,
  );

  const finalizada = await api.locacoesApi.finalizar(locacao.id);
  assert.equal(finalizada.status, 'FINALIZADA');

  const historico = await api.locacoesApi.listar();
  assert.equal(historico.length, 1);
  assert.equal(historico[0].veiculo.placa, placa);
});

test('frontend aciona o encerramento da sessão quando o token é rejeitado', async () => {
  let mensagemRecebida = null;
  api.definirAcaoDeSessaoExpirada((mensagem) => {
    mensagemRecebida = mensagem;
  });
  api.salvarToken('token.invalido.qualquer');

  await assert.rejects(api.veiculosApi.listar(), /inválido/);
  assert.equal(mensagemRecebida, 'Token de autenticação inválido.');
});
