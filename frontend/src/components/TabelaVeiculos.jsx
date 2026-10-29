import { Link } from 'react-router-dom';
import StatusVeiculo from './StatusVeiculo.jsx';
import { formatarMoeda } from '../utils/formatacao.js';

export default function TabelaVeiculos({ veiculos }) {
  return (
    <div className="tabela-rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Placa</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Ano</th>
            <th className="numero">Diária</th>
            <th>Situação</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {veiculos.map((veiculo) => (
            <tr key={veiculo.id}>
              <td className="placa">{veiculo.placa}</td>
              <td>{veiculo.marca}</td>
              <td>{veiculo.modelo}</td>
              <td>{veiculo.ano}</td>
              <td className="numero">{formatarMoeda(veiculo.valorDiaria)}</td>
              <td>
                <StatusVeiculo disponivel={veiculo.disponivel} />
              </td>
              <td className="acao">
                {veiculo.disponivel && <Link to={`/locacoes/nova?veiculo=${veiculo.id}`}>Alugar</Link>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
