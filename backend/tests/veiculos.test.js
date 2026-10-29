import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  iniciarServidor,
  encerrarServidor,
  limparBanco,
  requisitar,
  criarUsuarioAutenticado,
  criarVeiculo,
} from './apoio.js';

let servidor;
let baseUrl;
let token;

before(async () => {
  ({ servidor, baseUrl } = await iniciarServidor());
});

after(() => encerrarServidor(servidor));

beforeEach(async () => {
  await limparBanco();
  ({ token } = await criarUsuarioAutenticado(baseUrl, 'frota@teste.com'));
});

const veiculoValido = { marca: 'Toyota', modelo: 'Yaris', placa: 'abc-1d23', ano: 2023, valorDiaria: 150.5 };

test('cadastra veículo válido com placa normalizada', async () => {
  const { status, corpo } = await requisitar(baseUrl, 'POST', '/veiculos', { corpo: veiculoValido, token });

  assert.equal(status, 201);
  assert.equal(corpo.placa, 'ABC1D23');
  assert.equal(corpo.disponivel, true);
  assert.equal(Number(corpo.valorDiaria), 150.5);
});

test('rejeita placa duplicada mesmo com formatação diferente', async () => {
  await requisitar(baseUrl, 'POST', '/veiculos', { corpo: veiculoValido, token });
  const { status } = await requisitar(baseUrl, 'POST', '/veiculos', {
    corpo: { ...veiculoValido, placa: 'ABC1D23' },
    token,
  });

  assert.equal(status, 409);
});

test('rejeita valor de diária zero, negativo ou inválido', async () => {
  for (const valorDiaria of [0, -10, 'abc', 10.555]) {
    const { status } = await requisitar(baseUrl, 'POST', '/veiculos', {
      corpo: { ...veiculoValido, valorDiaria },
      token,
    });
    assert.equal(status, 400);
  }
});

test('rejeita marca vazia e ano inválido', async () => {
  const semMarca = await requisitar(baseUrl, 'POST', '/veiculos', { corpo: { ...veiculoValido, marca: '  ' }, token });
  const anoInvalido = await requisitar(baseUrl, 'POST', '/veiculos', { corpo: { ...veiculoValido, ano: 1800 }, token });

  assert.equal(semMarca.status, 400);
  assert.equal(anoInvalido.status, 400);
});

test('lista todos os veículos e apenas os disponíveis', async () => {
  await criarVeiculo({ placa: 'AAA1A11' });
  await criarVeiculo({ placa: 'BBB2B22', disponivel: false });

  const todos = await requisitar(baseUrl, 'GET', '/veiculos', { token });
  const disponiveis = await requisitar(baseUrl, 'GET', '/veiculos/disponiveis', { token });

  assert.equal(todos.status, 200);
  assert.equal(todos.corpo.length, 2);
  assert.equal(disponiveis.status, 200);
  assert.deepEqual(disponiveis.corpo.map((veiculo) => veiculo.placa), ['AAA1A11']);
});
