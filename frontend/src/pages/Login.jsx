import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Mensagem from '../components/Mensagem.jsx';
import TelaAutenticacao from '../components/TelaAutenticacao.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email ?? '');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  if (usuario) {
    return <Navigate to="/" replace />;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');
    if (!email.trim() || !senha) {
      setErro('Informe e-mail e senha.');
      return;
    }

    setEnviando(true);
    try {
      await login(email, senha);
      navigate('/', { replace: true });
    } catch (falha) {
      setErro(falha.message);
      setEnviando(false);
    }
  }

  return (
    <TelaAutenticacao>
      <form className="formulario cartao-autenticacao" onSubmit={enviar} noValidate>
        <h1>Entrar</h1>
        <p className="texto-apoio">Acesse o sistema de locação de veículos.</p>
        <Mensagem tipo="sucesso">{location.state?.sucesso}</Mensagem>
        <Mensagem tipo="aviso">{location.state?.aviso}</Mensagem>
        <label>
          E-mail
          <input type="email" value={email} onChange={(evento) => setEmail(evento.target.value)} autoComplete="email" />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            autoComplete="current-password"
          />
        </label>
        <Mensagem>{erro}</Mensagem>
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="texto-apoio">
          Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </form>
    </TelaAutenticacao>
  );
}
