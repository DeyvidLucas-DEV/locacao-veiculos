import { Prisma } from '@prisma/client';
import HttpError from '../lib/HttpError.js';

export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: 'Rota não encontrada.' });
}

export function tratarErros(erro, req, res, next) {
  if (erro instanceof HttpError) {
    return res.status(erro.status).json({ erro: erro.message });
  }

  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'O corpo da requisição não é um JSON válido.' });
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
    return res.status(409).json({ erro: 'Já existe um registro com estes dados.' });
  }

  console.error(erro);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}
