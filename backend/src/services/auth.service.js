import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import HttpError from '../lib/HttpError.js';

const SALT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TAMANHO_MINIMO_SENHA = 6;

const camposPublicos = { id: true, nome: true, email: true, dataCadastro: true };

function validarCadastro({ nome, email, senha }) {
  const nomeLimpo = typeof nome === 'string' ? nome.trim() : '';
  const emailLimpo = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (nomeLimpo.length < 2 || nomeLimpo.length > 120) {
    throw new HttpError(400, 'Informe um nome entre 2 e 120 caracteres.');
  }
  if (!EMAIL_REGEX.test(emailLimpo) || emailLimpo.length > 160) {
    throw new HttpError(400, 'Informe um e-mail válido.');
  }
  if (typeof senha !== 'string' || senha.length < TAMANHO_MINIMO_SENHA) {
    throw new HttpError(400, `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
  }

  return { nome: nomeLimpo, email: emailLimpo, senha };
}

export async function registrarUsuario(dados) {
  const { nome, email, senha } = validarCadastro(dados);

  const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
  if (usuarioExistente) {
    throw new HttpError(409, 'Já existe um usuário cadastrado com este e-mail.');
  }

  const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

  return prisma.usuario.create({
    data: { nome, email, senha: senhaHash },
    select: camposPublicos,
  });
}

export async function autenticarUsuario({ email, senha }) {
  if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
    throw new HttpError(400, 'Informe e-mail e senha.');
  }

  const usuario = await prisma.usuario.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  const senhaCorreta = usuario ? await bcrypt.compare(senha, usuario.senha) : false;
  if (!senhaCorreta) {
    throw new HttpError(401, 'E-mail ou senha inválidos.');
  }

  const token = jwt.sign({ sub: usuario.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  });

  const { senha: _senha, ...usuarioPublico } = usuario;
  return { token, usuario: usuarioPublico };
}

export function validarToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (erro) {
    if (erro instanceof jwt.TokenExpiredError) {
      throw new HttpError(401, 'Sessão expirada. Faça login novamente.');
    }
    throw new HttpError(401, 'Token de autenticação inválido.');
  }
}

export async function buscarUsuarioPorId(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, select: camposPublicos });
  if (!usuario) {
    throw new HttpError(401, 'Usuário do token não encontrado.');
  }
  return usuario;
}
