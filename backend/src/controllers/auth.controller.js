import * as authService from '../services/auth.service.js';

export async function registrar(req, res) {
  const usuario = await authService.registrarUsuario(req.body ?? {});
  res.status(201).json(usuario);
}

export async function login(req, res) {
  const sessao = await authService.autenticarUsuario(req.body ?? {});
  res.status(200).json(sessao);
}

export function usuarioAutenticado(req, res) {
  res.status(200).json(req.usuario);
}
