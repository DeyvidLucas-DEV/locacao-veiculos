import * as locacaoService from '../services/locacao.service.js';

export async function registrar(req, res) {
  const { veiculoId, dataInicio, dataPrevistaDevolucao } = req.body ?? {};
  const locacao = await locacaoService.registrarLocacao(req.usuario.id, {
    veiculoId,
    dataInicio,
    dataPrevistaDevolucao,
  });
  res.status(201).json(locacao);
}

export async function listar(req, res) {
  const locacoes = await locacaoService.listarLocacoesDoUsuario(req.usuario.id);
  res.status(200).json(locacoes);
}

export async function finalizar(req, res) {
  const locacao = await locacaoService.finalizarLocacao(req.usuario.id, req.params.id);
  res.status(200).json(locacao);
}
