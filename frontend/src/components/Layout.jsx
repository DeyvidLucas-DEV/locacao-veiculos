import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import '../styles/layout.css';

const links = [
  { para: '/', texto: 'Painel', exato: true },
  { para: '/veiculos', texto: 'Veículos' },
  { para: '/locacoes/nova', texto: 'Nova locação' },
  { para: '/locacoes', texto: 'Minhas locações', exato: true },
];

export default function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="layout">
      <aside className="barra-lateral">
        <div className="marca">
          Locadora
          <span>Gestão de frota</span>
        </div>
        <nav className="menu">
          {links.map((link) => (
            <NavLink key={link.para} to={link.para} end={link.exato}>
              {link.texto}
            </NavLink>
          ))}
        </nav>
        <div className="usuario-sessao">
          <div className="usuario-dados">
            <strong>{usuario.nome}</strong>
            <span>{usuario.email}</span>
          </div>
          <button type="button" className="botao-sair" onClick={logout}>
            Sair
          </button>
        </div>
      </aside>
      <main className="conteudo">
        <Outlet />
      </main>
    </div>
  );
}
