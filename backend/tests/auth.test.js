import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { iniciarServidor, encerrarServidor, limparBanco, requisitar, prisma } from './apoio.js';

let servidor;
let baseUrl;

before(async () => {
  ({ servidor, baseUrl } = await iniciarServidor());
});

after(() => encerrarServidor(servidor));

beforeEach(limparBanco);

const novoUsuario = { nome: 'Maria Souza', email: 'maria@teste.com', senha: 'senha123' };

test('cadastra usuário válido sem expor a senha e armazena hash bcrypt', async () => {
  const { status, corpo } = await requisitar(baseUrl, 'POST', '/auth/register', { corpo: novoUsuario });

  assert.equal(status, 201);
  assert.equal(corpo.email, 'maria@teste.com');
  assert.equal(corpo.senha, undefined);

  const salvo = await prisma.usuario.findUnique({ where: { email: 'maria@teste.com' } });
  assert.notEqual(salvo.senha, novoUsuario.senha);
  assert.match(salvo.senha, /^\$2[aby]\$/);
});

test('rejeita cadastro com e-mail duplicado', async () => {
  await requisitar(baseUrl, 'POST', '/auth/register', { corpo: novoUsuario });
  const { status, corpo } = await requisitar(baseUrl, 'POST', '/auth/register', {
    corpo: { ...novoUsuario, email: 'MARIA@teste.com' },
  });

  assert.equal(status, 409);
  assert.ok(corpo.erro);
});

test('rejeita cadastro com dados inválidos', async () => {
  const { status } = await requisitar(baseUrl, 'POST', '/auth/register', {
    corpo: { nome: 'M', email: 'email-invalido', senha: '123' },
  });

  assert.equal(status, 400);
});

test('faz login com senha correta e retorna JWT', async () => {
  await requisitar(baseUrl, 'POST', '/auth/register', { corpo: novoUsuario });
  const { status, corpo } = await requisitar(baseUrl, 'POST', '/auth/login', {
    corpo: { email: novoUsuario.email, senha: novoUsuario.senha },
  });

  assert.equal(status, 200);
  assert.equal(corpo.token.split('.').length, 3);
  assert.equal(corpo.usuario.email, novoUsuario.email);
  assert.equal(corpo.usuario.senha, undefined);

  const perfil = await requisitar(baseUrl, 'GET', '/auth/me', { token: corpo.token });
  assert.equal(perfil.status, 200);
  assert.equal(perfil.corpo.email, novoUsuario.email);
});

test('rejeita login com senha incorreta', async () => {
  await requisitar(baseUrl, 'POST', '/auth/register', { corpo: novoUsuario });
  const { status, corpo } = await requisitar(baseUrl, 'POST', '/auth/login', {
    corpo: { email: novoUsuario.email, senha: 'senhaErrada' },
  });

  assert.equal(status, 401);
  assert.equal(corpo.token, undefined);
});

test('rejeita operações protegidas sem JWT ou com JWT inválido', async () => {
  const semToken = [
    await requisitar(baseUrl, 'GET', '/veiculos'),
    await requisitar(baseUrl, 'POST', '/veiculos', { corpo: {} }),
    await requisitar(baseUrl, 'GET', '/locacoes'),
    await requisitar(baseUrl, 'POST', '/locacoes', { corpo: {} }),
    await requisitar(baseUrl, 'PATCH', '/locacoes/1/finalizar'),
    await requisitar(baseUrl, 'GET', '/auth/me'),
  ];
  for (const resposta of semToken) {
    assert.equal(resposta.status, 401);
  }

  const tokenInvalido = await requisitar(baseUrl, 'GET', '/veiculos', { token: 'abc.def.ghi' });
  assert.equal(tokenInvalido.status, 401);
});
