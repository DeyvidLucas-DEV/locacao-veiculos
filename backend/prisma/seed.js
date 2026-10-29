import 'dotenv/config';
import bcrypt from 'bcrypt';
import prisma from '../src/lib/prisma.js';
import { calcularQuantidadeDiarias, calcularValorTotal } from '../src/services/locacao.service.js';

const veiculos = [
  { marca: 'Chevrolet', modelo: 'Onix 1.0', placa: 'QWE1A23', ano: 2023, valorDiaria: '129.90' },
  { marca: 'Fiat', modelo: 'Argo Drive', placa: 'RTY2B34', ano: 2022, valorDiaria: '119.90' },
  { marca: 'Hyundai', modelo: 'HB20 Comfort', placa: 'UIO3C45', ano: 2024, valorDiaria: '139.90' },
  { marca: 'Volkswagen', modelo: 'T-Cross Highline', placa: 'PAS4D56', ano: 2023, valorDiaria: '219.00' },
  { marca: 'Toyota', modelo: 'Corolla XEi', placa: 'DFG5E67', ano: 2022, valorDiaria: '259.00' },
  { marca: 'Jeep', modelo: 'Renegade Longitude', placa: 'HJK6F78', ano: 2021, valorDiaria: '229.50' },
  { marca: 'Renault', modelo: 'Kwid Zen', placa: 'LZX7G89', ano: 2024, valorDiaria: '99.90' },
  { marca: 'Honda', modelo: 'HR-V EXL', placa: 'CVB8H90', ano: 2023, valorDiaria: '279.00' },
];

async function cadastrarVeiculos() {
  for (const veiculo of veiculos) {
    await prisma.veiculo.upsert({
      where: { placa: veiculo.placa },
      update: {},
      create: veiculo,
    });
  }
}

async function cadastrarUsuarioDemonstrativo() {
  const email = process.env.DEMO_USER_EMAIL;
  const senha = process.env.DEMO_USER_PASSWORD;
  if (!email || !senha) {
    return null;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  return prisma.usuario.upsert({
    where: { email: email.toLowerCase() },
    update: {},
    create: { nome: 'Usuário Demonstração', email: email.toLowerCase(), senha: senhaHash },
  });
}

async function cadastrarHistoricoDemonstrativo(usuario) {
  const possuiLocacoes = await prisma.locacao.count({ where: { usuarioId: usuario.id } });
  if (possuiLocacoes) {
    return;
  }

  const veiculo = await prisma.veiculo.findUnique({ where: { placa: 'LZX7G89' } });
  const dataInicio = new Date('2026-09-01T09:00:00-03:00');
  const dataPrevistaDevolucao = new Date('2026-09-04T09:00:00-03:00');
  const quantidadeDiarias = calcularQuantidadeDiarias(dataInicio, dataPrevistaDevolucao);

  await prisma.locacao.create({
    data: {
      usuarioId: usuario.id,
      veiculoId: veiculo.id,
      dataInicio,
      dataPrevistaDevolucao,
      dataDevolucao: new Date('2026-09-04T08:30:00-03:00'),
      valorTotal: calcularValorTotal(veiculo.valorDiaria, quantidadeDiarias),
      status: 'FINALIZADA',
    },
  });
}

async function main() {
  await cadastrarVeiculos();
  const usuario = await cadastrarUsuarioDemonstrativo();
  if (usuario) {
    await cadastrarHistoricoDemonstrativo(usuario);
  }
  console.log('Seed concluído.');
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
