import HttpError from '../lib/HttpError.js';
import { buscarUsuarioPorId, validarToken } from '../services/auth.service.js';

export default async function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization ?? '').split(' ');

  if (tipo !== 'Bearer' || !token) {
    throw new HttpError(401, 'Token de autenticação não informado.');
  }

  const payload = validarToken(token);
  req.usuario = await buscarUsuarioPorId(Number(payload.sub));
  next();
}
