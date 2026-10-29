import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import HttpError from '../lib/HttpError.js';

const PLACA_REGEX = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
const VALOR_REGEX = /^\d{1,8}(\.\d{1,2})?$/;
const ANO_MINIMO = 1950;

export function normalizarPlaca(placa) {
  return String(placa ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function validarTexto(valor, campo, tamanhoMaximo) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!texto) {
    throw new HttpError(400, `O campo ${campo} é obrigatório.`);
  }
  if (texto.length > tamanhoMaximo) {
    throw new HttpError(400, `O campo ${campo} deve ter no máximo ${tamanhoMaximo} caracteres.`);
  }
  return texto;
}

function validarAno(ano) {
  const anoNumerico = Number(ano);
  const anoMaximo = new Date().getFullYear() + 1;
  if (!Number.isInteger(anoNumerico) || anoNumerico < ANO_MINIMO || anoNumerico > anoMaximo) {
    throw new HttpError(400, `Informe um ano entre ${ANO_MINIMO} e ${anoMaximo}.`);
  }
  return anoNumerico;
}

function validarValorDiaria(valorDiaria) {
  const texto = String(valorDiaria ?? '').trim();
  if (!VALOR_REGEX.test(texto) || Number(texto) <= 0) {
    throw new HttpError(400, 'O valor da diária deve ser maior que zero, com até duas casas decimais.');
  }
  return new Prisma.Decimal(texto);
}

function validarVeiculo({ marca, modelo, placa, ano, valorDiaria }) {
  const placaNormalizada = normalizarPlaca(placa);
  if (!PLACA_REGEX.test(placaNormalizada)) {
    throw new HttpError(400, 'Informe uma placa válida, por exemplo ABC1234 ou ABC1D23.');
  }

  return {
    marca: validarTexto(marca, 'marca', 60),
    modelo: validarTexto(modelo, 'modelo', 80),
    placa: placaNormalizada,
    ano: validarAno(ano),
    valorDiaria: validarValorDiaria(valorDiaria),
  };
}

export async function cadastrarVeiculo(dados) {
  const veiculo = validarVeiculo(dados);

  const placaEmUso = await prisma.veiculo.findUnique({ where: { placa: veiculo.placa } });
  if (placaEmUso) {
    throw new HttpError(409, 'Já existe um veículo cadastrado com esta placa.');
  }

  return prisma.veiculo.create({ data: veiculo });
}

export function listarVeiculos() {
  return prisma.veiculo.findMany({ orderBy: [{ marca: 'asc' }, { modelo: 'asc' }] });
}

export function listarVeiculosDisponiveis() {
  return prisma.veiculo.findMany({
    where: { disponivel: true },
    orderBy: [{ marca: 'asc' }, { modelo: 'asc' }],
  });
}
