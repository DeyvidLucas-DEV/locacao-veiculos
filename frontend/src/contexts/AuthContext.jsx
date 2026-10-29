import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, definirAcaoDeSessaoExpirada, obterToken, removerToken, salvarToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(obterToken()));
  const navigate = useNavigate();

  const logout = useCallback(
    (mensagem) => {
      removerToken();
      setUsuario(null);
      navigate('/login', { replace: true, state: mensagem ? { aviso: mensagem } : undefined });
    },
    [navigate],
  );

  useEffect(() => {
    definirAcaoDeSessaoExpirada((mensagem) => logout(mensagem || 'Sua sessão expirou. Faça login novamente.'));
  }, [logout]);

  useEffect(() => {
    if (!obterToken()) {
      return;
    }
    authApi
      .usuarioAtual()
      .then(setUsuario)
      .catch(() => removerToken())
      .finally(() => setCarregando(false));
  }, []);

  async function login(email, senha) {
    const sessao = await authApi.login({ email, senha });
    salvarToken(sessao.token);
    setUsuario(sessao.usuario);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout: () => logout() }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
