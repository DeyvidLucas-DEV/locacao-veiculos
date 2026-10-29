import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import Login from './pages/Login.jsx';
import Cadastro from './pages/Cadastro.jsx';
import Painel from './pages/Painel.jsx';
import Veiculos from './pages/Veiculos.jsx';
import NovaLocacao from './pages/NovaLocacao.jsx';
import MinhasLocacoes from './pages/MinhasLocacoes.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route
        element={
          <RotaProtegida>
            <Layout />
          </RotaProtegida>
        }
      >
        <Route path="/" element={<Painel />} />
        <Route path="/veiculos" element={<Veiculos />} />
        <Route path="/locacoes/nova" element={<NovaLocacao />} />
        <Route path="/locacoes" element={<MinhasLocacoes />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
