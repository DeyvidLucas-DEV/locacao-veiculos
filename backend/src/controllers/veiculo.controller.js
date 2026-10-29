import * as veiculoService from '../services/veiculo.service.js';

export async function cadastrar(req, res) {
  const veiculo = await veiculoService.cadastrarVeiculo(req.body ?? {});
  res.status(201).json(veiculo);
}

export async function listar(req, res) {
  const veiculos = await veiculoService.listarVeiculos();
  res.status(200).json(veiculos);
}

export async function listarDisponiveis(req, res) {
  const veiculos = await veiculoService.listarVeiculosDisponiveis();
  res.status(200).json(veiculos);
}
