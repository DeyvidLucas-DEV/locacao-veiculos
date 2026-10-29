import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import HttpError from '../lib/HttpError.js';

const MILISSEGUNDOS_POR_DIA = 86400000;

const dadosDoVeiculo = {
  select: { id: true, marca: true, modelo: true, placa: true, ano: true, valorDiaria: true },
};

export function calcularQuantidadeDiarias(dataInicio, dataPrevistaDevolucao) {
  const duracaoEmMilissegundos = dataPrevistaDevolucao.getTime() - dataInicio.getTime();
  return Math.ceil(duracaoEmMilissegundos / MILISSEGUNDOS_POR_DIA);
}

export function calcularValorTotal(valorDiaria, quantidadeDiarias) {
  return new Prisma.Decimal(valorDiaria).mul(quantidadeDiarias);
}

function converterId(valor, mensagem) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, mensagem);
  }
  return id;
}

function converterData(valor, campo) {
  const data = typeof valor === 'string' && valor.trim() ? new Date(valor) : null;
  if (!data || Number.isNaN(data.getTime())) {
    throw new HttpError(400, `Informe uma ${campo} válida.`);
  }
  return data;
}

function validarLocacao({ veiculoId, dataInicio, dataPrevistaDevolucao }) {
  const dados = {
    veiculoId: converterId(veiculoId, 'Selecione um veículo válido.'),
    dataInicio: converterData(dataInicio, 'data de início'),
    dataPrevistaDevolucao: converterData(dataPrevistaDevolucao, 'data prevista de devolução'),
  };

  if (dados.dataPrevistaDevolucao <= dados.dataInicio) {
    throw new HttpError(400, 'A data prevista de devolução deve ser posterior à data de início.');
  }

  return dados;
}

export async function registrarLocacao(usuarioId, dadosRecebidos) {
  const { veiculoId, dataInicio, dataPrevistaDevolucao } = validarLocacao(dadosRecebidos);

  const veiculo = await prisma.veiculo.findUnique({ where: { id: veiculoId } });
  if (!veiculo) {
    throw new HttpError(404, 'Veículo não encontrado.');
  }

  const quantidadeDiarias = calcularQuantidadeDiarias(dataInicio, dataPrevistaDevolucao);
  const valorTotal = calcularValorTotal(veiculo.valorDiaria, quantidadeDiarias);

  return prisma.$transaction(async (tx) => {
    const reserva = await tx.veiculo.updateMany({
      where: { id: veiculoId, disponivel: true },
      data: { disponivel: false },
    });

    if (reserva.count === 0) {
      throw new HttpError(409, 'Veículo indisponível para locação.');
    }

    return tx.locacao.create({
      data: { usuarioId, veiculoId, dataInicio, dataPrevistaDevolucao, valorTotal },
      include: { veiculo: dadosDoVeiculo },
    });
  });
}

export function listarLocacoesDoUsuario(usuarioId) {
  return prisma.locacao.findMany({
    where: { usuarioId },
    include: { veiculo: dadosDoVeiculo },
    orderBy: [{ status: 'asc' }, { dataInicio: 'desc' }],
  });
}

export async function finalizarLocacao(usuarioId, locacaoIdRecebido) {
  const locacaoId = converterId(locacaoIdRecebido, 'Identificador de locação inválido.');

  const locacao = await prisma.locacao.findUnique({ where: { id: locacaoId } });
  if (!locacao) {
    throw new HttpError(404, 'Locação não encontrada.');
  }
  if (locacao.usuarioId !== usuarioId) {
    throw new HttpError(403, 'Você não tem permissão para finalizar esta locação.');
  }
  if (locacao.status === 'FINALIZADA') {
    throw new HttpError(409, 'Esta locação já foi finalizada.');
  }

  return prisma.$transaction(async (tx) => {
    const encerramento = await tx.locacao.updateMany({
      where: { id: locacaoId, status: 'ATIVA' },
      data: { status: 'FINALIZADA', dataDevolucao: new Date() },
    });

    if (encerramento.count === 0) {
      throw new HttpError(409, 'Esta locação já foi finalizada.');
    }

    await tx.veiculo.update({
      where: { id: locacao.veiculoId },
      data: { disponivel: true },
    });

    return tx.locacao.findUnique({
      where: { id: locacaoId },
      include: { veiculo: dadosDoVeiculo },
    });
  });
}
