import 'dotenv/config';

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET ||= 'chave-de-teste';

const { default: app } = await import('../src/app.js');
const { default: prisma } = await import('../src/lib/prisma.js');

export { prisma };

export async function iniciarServidor() {
  const servidor = app.listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  const { port } = servidor.address();
  return { servidor, baseUrl: `http://127.0.0.1:${port}/api` };
}

export async function encerrarServidor(servidor) {
  await new Promise((resolve) => servidor.close(resolve));
  await prisma.$disconnect();
}

export async function limparBanco() {
  await prisma.locacao.deleteMany();
  await prisma.veiculo.deleteMany();
  await prisma.usuario.deleteMany();
}

export async function requisitar(baseUrl, metodo, caminho, { corpo, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const resposta = await fetch(`${baseUrl}${caminho}`, {
    method: metodo,
    headers,
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  return { status: resposta.status, corpo: await resposta.json() };
}

export async function criarUsuarioAutenticado(baseUrl, email, senha = 'senha123') {
  await requisitar(baseUrl, 'POST', '/auth/register', { corpo: { nome: 'Usuário Teste', email, senha } });
  const { corpo } = await requisitar(baseUrl, 'POST', '/auth/login', { corpo: { email, senha } });
  return corpo;
}

export function criarVeiculo(dados = {}) {
  return prisma.veiculo.create({
    data: { marca: 'Fiat', modelo: 'Mobi', placa: 'AAA1A11', ano: 2022, valorDiaria: '100.00', ...dados },
  });
}
