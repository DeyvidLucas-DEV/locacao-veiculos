import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  iniciarServidor,
  encerrarServidor,
  limparBanco,
  requisitar,
  criarUsuarioAutenticado,
  criarVeiculo,
  prisma,
} from './apoio.js';

let servidor;
let baseUrl;
let token;
let usuario;
let veiculo;

before(async () => {
  ({ servidor, baseUrl } = await iniciarServidor());
});

after(() => encerrarServidor(servidor));

beforeEach(async () => {
  await limparBanco();
  ({ token, usuario } = await criarUsuarioAutenticado(baseUrl, 'cliente@teste.com'));
  veiculo = await criarVeiculo({ valorDiaria: '120.00' });
});

function periodo(horas) {
  const dataInicio = new Date('2026-11-10T09:00:00Z');
  const dataPrevistaDevolucao = new Date(dataInicio.getTime() + horas * 3600000);
  return { dataInicio: dataInicio.toISOString(), dataPrevistaDevolucao: dataPrevistaDevolucao.toISOString() };
}

function alugar(dados, tokenUsuario = token) {
  return requisitar(baseUrl, 'POST', '/locacoes', { corpo: { veiculoId: veiculo.id, ...dados }, token: tokenUsuario });
}

test('registra locação válida, calcula o valor no backend e deixa o veículo indisponível', async () => {
  const { status, corpo } = await alugar({ ...periodo(50), valorTotal: 1, usuarioId: 999 });

  assert.equal(status, 201);
  assert.equal(corpo.status, 'ATIVA');
  assert.equal(corpo.usuarioId, usuario.id);
  assert.equal(Number(corpo.valorTotal), 360);
  assert.equal(corpo.veiculo.placa, 'AAA1A11');

  const veiculoAtualizado = await prisma.veiculo.findUnique({ where: { id: veiculo.id } });
  assert.equal(veiculoAtualizado.disponivel, false);
});

test('cobra uma diária para período de 24 horas', async () => {
  const { corpo } = await alugar(periodo(24));
  assert.equal(Number(corpo.valorTotal), 120);
});

test('rejeita datas inválidas', async () => {
  const devolucaoAnterior = await alugar({
    dataInicio: '2026-11-10T09:00:00Z',
    dataPrevistaDevolucao: '2026-11-09T09:00:00Z',
  });
  const mesmaData = await alugar({
    dataInicio: '2026-11-10T09:00:00Z',
    dataPrevistaDevolucao: '2026-11-10T09:00:00Z',
  });
  const dataMalFormada = await alugar({ dataInicio: 'amanhã', dataPrevistaDevolucao: '2026-11-10T09:00:00Z' });

  assert.equal(devolucaoAnterior.status, 400);
  assert.equal(mesmaData.status, 400);
  assert.equal(dataMalFormada.status, 400);
  assert.equal(await prisma.locacao.count(), 0);
});

test('rejeita locação de veículo inexistente', async () => {
  const { status } = await requisitar(baseUrl, 'POST', '/locacoes', {
    corpo: { veiculoId: veiculo.id + 1000, ...periodo(24) },
    token,
  });
  assert.equal(status, 404);
});

test('rejeita locação de veículo indisponível', async () => {
  await alugar(periodo(24));
  const { status, corpo } = await alugar(periodo(48));

  assert.equal(status, 409);
  assert.match(corpo.erro, /indisponível/);
});

test('aceita apenas uma de várias locações simultâneas para o mesmo veículo', async () => {
  const outroUsuario = await criarUsuarioAutenticado(baseUrl, 'concorrente@teste.com');
  const tokens = [token, outroUsuario.token, token, outroUsuario.token, token, outroUsuario.token];

  const respostas = await Promise.all(tokens.map((tokenUsuario) => alugar(periodo(24), tokenUsuario)));
  const status = respostas.map((resposta) => resposta.status);

  assert.equal(status.filter((codigo) => codigo === 201).length, 1);
  assert.equal(status.filter((codigo) => codigo === 409).length, tokens.length - 1);
  assert.equal(await prisma.locacao.count({ where: { veiculoId: veiculo.id, status: 'ATIVA' } }), 1);
});

test('lista apenas as locações do usuário autenticado com dados do veículo', async () => {
  const outroUsuario = await criarUsuarioAutenticado(baseUrl, 'outro@teste.com');
  const outroVeiculo = await criarVeiculo({ placa: 'CCC3C33' });
  await alugar(periodo(24));
  await requisitar(baseUrl, 'POST', '/locacoes', {
    corpo: { veiculoId: outroVeiculo.id, ...periodo(24) },
    token: outroUsuario.token,
  });

  const { status, corpo } = await requisitar(baseUrl, 'GET', '/locacoes', { token });

  assert.equal(status, 200);
  assert.equal(corpo.length, 1);
  assert.equal(corpo[0].usuarioId, usuario.id);
  assert.equal(corpo[0].veiculo.placa, 'AAA1A11');
});

test('impede que outro usuário finalize a locação', async () => {
  const { corpo: locacao } = await alugar(periodo(24));
  const intruso = await criarUsuarioAutenticado(baseUrl, 'intruso@teste.com');

  const { status } = await requisitar(baseUrl, 'PATCH', `/locacoes/${locacao.id}/finalizar`, { token: intruso.token });

  assert.equal(status, 403);
  const locacaoSalva = await prisma.locacao.findUnique({ where: { id: locacao.id } });
  assert.equal(locacaoSalva.status, 'ATIVA');
});

test('retorna 404 ao finalizar locação inexistente', async () => {
  const { status } = await requisitar(baseUrl, 'PATCH', '/locacoes/999999/finalizar', { token });
  assert.equal(status, 404);
});

test('finaliza locação ativa, restaura a disponibilidade e rejeita segunda finalização', async () => {
  const { corpo: locacao } = await alugar(periodo(24));

  const finalizacao = await requisitar(baseUrl, 'PATCH', `/locacoes/${locacao.id}/finalizar`, { token });
  assert.equal(finalizacao.status, 200);
  assert.equal(finalizacao.corpo.status, 'FINALIZADA');
  assert.ok(finalizacao.corpo.dataDevolucao);

  const veiculoAtualizado = await prisma.veiculo.findUnique({ where: { id: veiculo.id } });
  assert.equal(veiculoAtualizado.disponivel, true);

  const segundaTentativa = await requisitar(baseUrl, 'PATCH', `/locacoes/${locacao.id}/finalizar`, { token });
  assert.equal(segundaTentativa.status, 409);
});

test('finalizações simultâneas da mesma locação resultam em apenas um sucesso', async () => {
  const { corpo: locacao } = await alugar(periodo(24));

  const respostas = await Promise.all(
    [1, 2, 3].map(() => requisitar(baseUrl, 'PATCH', `/locacoes/${locacao.id}/finalizar`, { token })),
  );

  assert.deepEqual(respostas.map((resposta) => resposta.status).sort(), [200, 409, 409]);
});

test('preserva o histórico após a finalização e permite nova locação do veículo', async () => {
  const { corpo: primeira } = await alugar(periodo(24));
  await requisitar(baseUrl, 'PATCH', `/locacoes/${primeira.id}/finalizar`, { token });

  const segunda = await alugar(periodo(72));
  assert.equal(segunda.status, 201);

  const { corpo: locacoes } = await requisitar(baseUrl, 'GET', '/locacoes', { token });
  assert.equal(locacoes.length, 2);

  const finalizada = locacoes.find((locacao) => locacao.id === primeira.id);
  assert.equal(finalizada.status, 'FINALIZADA');
  assert.equal(Number(finalizada.valorTotal), 120);
  assert.ok(finalizada.dataDevolucao);
  assert.equal(finalizada.veiculo.placa, 'AAA1A11');
});
