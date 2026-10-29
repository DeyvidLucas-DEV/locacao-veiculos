import '../styles/auth.css';

export default function TelaAutenticacao({ children }) {
  return (
    <div className="tela-autenticacao">
      <div className="caixa-autenticacao">
        <div className="marca-autenticacao">
          Locadora
          <span>Sistema de locação de veículos</span>
        </div>
        {children}
      </div>
    </div>
  );
}
