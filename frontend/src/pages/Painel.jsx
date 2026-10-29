import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Mensagem from '../components/Mensagem.jsx';
import TabelaVeiculos from '../components/TabelaVeiculos.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { locacoesApi, veiculosApi } from '../services/api.js';
import { formatarDataHora, formatarMoeda } from '../utils/formatacao.js';

export default function Painel() {
  const { usuario } = useAuth();
  const [veiculos, setVeiculos] = useState([]);
  const [locacoes, setLocacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    Promise.all([veiculosApi.listar(), locacoesApi.listar()])
      .then(([listaVeiculos, listaLocacoes]) => {
        setVeiculos(listaVeiculos);
        setLocacoes(listaLocacoes);
      })
      .catch((falha) => setErro(falha.message))
      .finally(() => setCarregando(false));
  }, []);

  const veiculosDisponiveis = veiculos.filter((veiculo) => veiculo.disponivel);
  const locacoesAtivas = locacoes.filter((locacao) => locacao.status === 'ATIVA');
  const finalizadas = locacoes.length - locacoesAtivas.length;

  const indicadores = [
    { rotulo: 'Veículos na frota', valor: veiculos.length },
    { rotulo: 'Disponíveis', valor: veiculosDisponiveis.length },
    { rotulo: 'Suas locações ativas', valor: locacoesAtivas.length },
    { rotulo: 'Suas locações finalizadas', valor: finalizadas },
  ];

  return (
    <section>
      <div className="titulo-pagina">
        <div>
          <h1>Painel</h1>
          <p className="texto-apoio">Usuário: {usuario.nome}</p>
        </div>
        <Link to="/locacoes/nova" className="botao">
          Nova locação
        </Link>
      </div>

      <Mensagem>{erro}</Mensagem>

      <div className="indicadores">
        {indicadores.map((indicador) => (
          <div key={indicador.rotulo} className="indicador">
            <span>{indicador.rotulo}</span>
            <strong>{carregando ? '-' : indicador.valor}</strong>
          </div>
        ))}
      </div>

      {!carregando && (
        <>
          <div className="secao">
            <div className="titulo-secao">
              <h2>Locações ativas</h2>
              <Link to="/locacoes">Ver todas</Link>
            </div>
            {locacoesAtivas.length === 0 ? (
              <p className="vazio">Você não possui locações ativas.</p>
            ) : (
              <div className="tabela-rolagem">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Veículo</th>
                      <th>Início</th>
                      <th>Devolução prevista</th>
                      <th className="numero">Valor total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locacoesAtivas.map((locacao) => (
                      <tr key={locacao.id}>
                        <td className="placa">{locacao.veiculo.placa}</td>
                        <td>
                          {locacao.veiculo.marca} {locacao.veiculo.modelo}
                        </td>
                        <td>{formatarDataHora(locacao.dataInicio)}</td>
                        <td>{formatarDataHora(locacao.dataPrevistaDevolucao)}</td>
                        <td className="numero">{formatarMoeda(locacao.valorTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="secao">
            <div className="titulo-secao">
              <h2>Veículos disponíveis</h2>
              <Link to="/veiculos">Ver frota completa</Link>
            </div>
            {veiculosDisponiveis.length === 0 ? (
              <p className="vazio">Nenhum veículo disponível no momento.</p>
            ) : (
              <TabelaVeiculos veiculos={veiculosDisponiveis.slice(0, 5)} />
            )}
          </div>
        </>
      )}
    </section>
  );
}
