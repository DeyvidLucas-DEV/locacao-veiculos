import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function RotaProtegida({ children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <p className="carregando-tela">Verificando sessão...</p>;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
