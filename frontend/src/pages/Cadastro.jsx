import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Mensagem from '../components/Mensagem.jsx';
import TelaAutenticacao from '../components/TelaAutenticacao.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { authApi } from '../services/api.js';

function validarCadastro({ nome, email, senha, confirmacaoSenha }) {
  if (nome.trim().length < 2) {
    return 'Informe seu nome.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return 'Informe um e-mail válido.';
  }
  if (senha.length < 6) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (senha !== confirmacaoSenha) {
    return 'As senhas não conferem.';
  }
  return '';
}

export default function Cadastro() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({ nome: '', email: '', senha: '', confirmacaoSenha: '' });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  function atualizarCampo(evento) {
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value });
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');

    const erroValidacao = validarCadastro(formulario);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setEnviando(true);
    try {
      const { nome, email, senha } = formulario;
      const novoUsuario = await authApi.registrar({ nome, email, senha });
      navigate('/login', {
        state: { sucesso: 'Cadastro realizado. Faça login para continuar.', email: novoUsuario.email },
      });
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <TelaAutenticacao>
      <form className="formulario cartao-autenticacao" onSubmit={enviar} noValidate>
        <h1>Criar conta</h1>
        <p className="texto-apoio">Cadastre-se para registrar locações.</p>
        <label>
          Nome
          <input name="nome" value={formulario.nome} onChange={atualizarCampo} autoComplete="name" maxLength={120} />
        </label>
        <label>
          E-mail
          <input name="email" type="email" value={formulario.email} onChange={atualizarCampo} autoComplete="email" />
        </label>
        <label>
          Senha
          <input
            name="senha"
            type="password"
            value={formulario.senha}
            onChange={atualizarCampo}
            autoComplete="new-password"
          />
        </label>
        <label>
          Confirmar senha
          <input
            name="confirmacaoSenha"
            type="password"
            value={formulario.confirmacaoSenha}
            onChange={atualizarCampo}
            autoComplete="new-password"
          />
        </label>
        <Mensagem>{erro}</Mensagem>
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? 'Cadastrando...' : 'Cadastrar'}
        </button>
        <p className="texto-apoio">
          Já possui conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </TelaAutenticacao>
  );
}
