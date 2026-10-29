import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Mensagem from '../components/Mensagem.jsx';
import { locacoesApi, veiculosApi } from '../services/api.js';
import { formatarDataHora, formatarMoeda, paraCampoDataHora } from '../utils/formatacao.js';
import '../styles/locacoes.css';

function periodoInicial() {
  const inicio = new Date();
  inicio.setHours(inicio.getHours() + 1, 0, 0, 0);
  const devolucao = new Date(inicio);
  devolucao.setDate(devolucao.getDate() + 1);
  return { dataInicio: paraCampoDataHora(inicio), dataPrevistaDevolucao: paraCampoDataHora(devolucao) };
}

function validarFormulario({ veiculoId, dataInicio, dataPrevistaDevolucao }) {
  if (!veiculoId) {
    return 'Selecione um veículo disponível.';
  }
  if (!dataInicio || !dataPrevistaDevolucao) {
    return 'Informe a data de início e a data prevista de devolução.';
  }
  if (new Date(dataPrevistaDevolucao) <= new Date(dataInicio)) {
    return 'A data prevista de devolução deve ser posterior à data de início.';
  }
  return '';
}

export default function NovaLocacao() {
  const [parametros] = useSearchParams();
  const [veiculosDisponiveis, setVeiculosDisponiveis] = useState([]);
  const [formulario, setFormulario] = useState({ veiculoId: parametros.get('veiculo') ?? '', ...periodoInicial() });
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [locacaoRegistrada, setLocacaoRegistrada] = useState(null);

  async function carregarVeiculosDisponiveis() {
    try {
      setVeiculosDisponiveis(await veiculosApi.listarDisponiveis());
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarVeiculosDisponiveis();
  }, []);

  function atualizarCampo(evento) {
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value });
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');
    setLocacaoRegistrada(null);

    const erroValidacao = validarFormulario(formulario);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setEnviando(true);
    try {
      const locacao = await locacoesApi.registrar({
        veiculoId: Number(formulario.veiculoId),
        dataInicio: new Date(formulario.dataInicio).toISOString(),
        dataPrevistaDevolucao: new Date(formulario.dataPrevistaDevolucao).toISOString(),
      });
      setLocacaoRegistrada(locacao);
      setFormulario({ veiculoId: '', ...periodoInicial() });
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
      carregarVeiculosDisponiveis();
    }
  }

  const veiculoSelecionado = veiculosDisponiveis.find((veiculo) => String(veiculo.id) === formulario.veiculoId);

  return (
    <section>
      <div className="titulo-pagina">
        <div>
          <h1>Nova locação</h1>
          <p className="texto-apoio">
            O valor total é calculado pelo servidor, contando cada fração de 24 horas como uma diária.
          </p>
        </div>
      </div>

      <div className="locacao-colunas">
        <form className="cartao formulario" onSubmit={enviar} noValidate>
          <h2>Dados da locação</h2>
          {carregando ? (
            <p className="texto-apoio">Carregando veículos disponíveis...</p>
          ) : (
            <label>
              Veículo
              <select name="veiculoId" value={formulario.veiculoId} onChange={atualizarCampo}>
                <option value="">Selecione um veículo</option>
                {veiculosDisponiveis.map((veiculo) => (
                  <option key={veiculo.id} value={veiculo.id}>
                    {veiculo.marca} {veiculo.modelo} | {veiculo.placa} | {formatarMoeda(veiculo.valorDiaria)} por dia
                  </option>
                ))}
              </select>
            </label>
          )}
          {!carregando && veiculosDisponiveis.length === 0 && (
            <Mensagem tipo="aviso">Nenhum veículo disponível no momento.</Mensagem>
          )}
          <div className="grade-campos">
            <label>
              Data de início
              <input type="datetime-local" name="dataInicio" value={formulario.dataInicio} onChange={atualizarCampo} />
            </label>
            <label>
              Data prevista de devolução
              <input
                type="datetime-local"
                name="dataPrevistaDevolucao"
                value={formulario.dataPrevistaDevolucao}
                min={formulario.dataInicio}
                onChange={atualizarCampo}
              />
            </label>
          </div>
          <Mensagem>{erro}</Mensagem>
          <button type="submit" className="botao" disabled={enviando || carregando}>
            {enviando ? 'Registrando...' : 'Confirmar locação'}
          </button>
        </form>

        <aside className="locacao-lateral">
          {locacaoRegistrada ? (
            <div className="painel-lateral resumo-locacao">
              <Mensagem tipo="sucesso">Locação registrada com sucesso.</Mensagem>
              <dl>
                <dt>Veículo</dt>
                <dd>
                  {locacaoRegistrada.veiculo.marca} {locacaoRegistrada.veiculo.modelo}
                </dd>
                <dt>Placa</dt>
                <dd className="placa">{locacaoRegistrada.veiculo.placa}</dd>
                <dt>Início</dt>
                <dd>{formatarDataHora(locacaoRegistrada.dataInicio)}</dd>
                <dt>Devolução prevista</dt>
                <dd>{formatarDataHora(locacaoRegistrada.dataPrevistaDevolucao)}</dd>
                <dt>Valor total</dt>
                <dd className="valor-destaque">{formatarMoeda(locacaoRegistrada.valorTotal)}</dd>
              </dl>
              <Link to="/locacoes" className="botao botao-secundario">
                Ver minhas locações
              </Link>
            </div>
          ) : (
            <div className="painel-lateral">
              <h2>Veículo selecionado</h2>
              {veiculoSelecionado ? (
                <dl>
                  <dt>Veículo</dt>
                  <dd>
                    {veiculoSelecionado.marca} {veiculoSelecionado.modelo}
                  </dd>
                  <dt>Placa</dt>
                  <dd className="placa">{veiculoSelecionado.placa}</dd>
                  <dt>Ano</dt>
                  <dd>{veiculoSelecionado.ano}</dd>
                  <dt>Diária</dt>
                  <dd>{formatarMoeda(veiculoSelecionado.valorDiaria)}</dd>
                </dl>
              ) : (
                <p className="vazio">Nenhum veículo selecionado.</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
