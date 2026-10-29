import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Mensagem from '../components/Mensagem.jsx';
import LocacaoCard from '../components/LocacaoCard.jsx';
import { locacoesApi } from '../services/api.js';
import { formatarDataHora, formatarMoeda } from '../utils/formatacao.js';
import '../styles/locacoes.css';

export default function MinhasLocacoes() {
  const [locacoes, setLocacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [finalizandoId, setFinalizandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function carregarLocacoes() {
    try {
      setLocacoes(await locacoesApi.listar());
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarLocacoes();
  }, []);

  async function finalizar(locacao) {
    setErro('');
    setSucesso('');
    setFinalizandoId(locacao.id);
    try {
      await locacoesApi.finalizar(locacao.id);
      setSucesso(`Devolução do ${locacao.veiculo.modelo} (${locacao.veiculo.placa}) registrada.`);
      await carregarLocacoes();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setFinalizandoId(null);
    }
  }

  const ativas = locacoes.filter((locacao) => locacao.status === 'ATIVA');
  const finalizadas = locacoes.filter((locacao) => locacao.status === 'FINALIZADA');

  return (
    <section>
      <div className="titulo-pagina">
        <div>
          <h1>Minhas locações</h1>
          <p className="texto-apoio">Locações em andamento e histórico de devoluções.</p>
        </div>
        <Link to="/locacoes/nova" className="botao">
          Nova locação
        </Link>
      </div>

      <Mensagem>{erro}</Mensagem>
      <Mensagem tipo="sucesso">{sucesso}</Mensagem>

      {carregando ? (
        <p className="vazio">Carregando locações...</p>
      ) : (
        <>
          <div className="secao">
            <div className="titulo-secao">
              <h2>Ativas ({ativas.length})</h2>
            </div>
            {ativas.length === 0 ? (
              <p className="vazio">Nenhuma locação ativa.</p>
            ) : (
              <div className="grade-locacoes">
                {ativas.map((locacao) => (
                  <LocacaoCard
                    key={locacao.id}
                    locacao={locacao}
                    finalizando={finalizandoId === locacao.id}
                    aoFinalizar={finalizar}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="secao">
            <div className="titulo-secao">
              <h2>Histórico ({finalizadas.length})</h2>
            </div>
            {finalizadas.length === 0 ? (
              <p className="vazio">Nenhuma locação finalizada.</p>
            ) : (
              <div className="tabela-rolagem">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Veículo</th>
                      <th>Início</th>
                      <th>Devolução prevista</th>
                      <th>Devolvido em</th>
                      <th className="numero">Diária</th>
                      <th className="numero">Valor total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalizadas.map((locacao) => (
                      <tr key={locacao.id}>
                        <td className="placa">{locacao.veiculo.placa}</td>
                        <td>
                          {locacao.veiculo.marca} {locacao.veiculo.modelo}
                        </td>
                        <td>{formatarDataHora(locacao.dataInicio)}</td>
                        <td>{formatarDataHora(locacao.dataPrevistaDevolucao)}</td>
                        <td>{formatarDataHora(locacao.dataDevolucao)}</td>
                        <td className="numero">{formatarMoeda(locacao.veiculo.valorDiaria)}</td>
                        <td className="numero">{formatarMoeda(locacao.valorTotal)}</td>
                        <td>
                          <span className="status status-encerrado">Finalizada</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
