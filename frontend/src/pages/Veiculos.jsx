import { useCallback, useEffect, useState } from 'react';
import Mensagem from '../components/Mensagem.jsx';
import TabelaVeiculos from '../components/TabelaVeiculos.jsx';
import VeiculoForm from '../components/VeiculoForm.jsx';
import { veiculosApi } from '../services/api.js';
import '../styles/veiculos.css';

export default function Veiculos() {
  const [veiculos, setVeiculos] = useState([]);
  const [somenteDisponiveis, setSomenteDisponiveis] = useState(false);
  const [exibirFormulario, setExibirFormulario] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarVeiculos = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const lista = somenteDisponiveis ? await veiculosApi.listarDisponiveis() : await veiculosApi.listar();
      setVeiculos(lista);
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setCarregando(false);
    }
  }, [somenteDisponiveis]);

  useEffect(() => {
    carregarVeiculos();
  }, [carregarVeiculos]);

  return (
    <section>
      <div className="titulo-pagina">
        <div>
          <h1>Veículos</h1>
          <p className="texto-apoio">Frota cadastrada e situação de disponibilidade.</p>
        </div>
        <button
          type="button"
          className={`botao ${exibirFormulario ? 'botao-secundario' : ''}`}
          onClick={() => setExibirFormulario(!exibirFormulario)}
        >
          {exibirFormulario ? 'Fechar cadastro' : 'Novo veículo'}
        </button>
      </div>

      {exibirFormulario && <VeiculoForm aoCadastrar={carregarVeiculos} />}

      <div className="secao">
        <div className="barra-filtro">
          <div className="abas" role="group" aria-label="Filtro de disponibilidade">
            <button
              type="button"
              className={!somenteDisponiveis ? 'ativo' : ''}
              aria-pressed={!somenteDisponiveis}
              onClick={() => setSomenteDisponiveis(false)}
            >
              Todos
            </button>
            <button
              type="button"
              className={somenteDisponiveis ? 'ativo' : ''}
              aria-pressed={somenteDisponiveis}
              onClick={() => setSomenteDisponiveis(true)}
            >
              Disponíveis
            </button>
          </div>
          {!carregando && (
            <span className="texto-apoio">
              {veiculos.length} {veiculos.length === 1 ? 'registro' : 'registros'}
            </span>
          )}
        </div>

        <Mensagem>{erro}</Mensagem>

        {carregando ? (
          <p className="vazio">Carregando veículos...</p>
        ) : veiculos.length === 0 ? (
          <p className="vazio">Nenhum veículo encontrado.</p>
        ) : (
          <TabelaVeiculos veiculos={veiculos} />
        )}
      </div>
    </section>
  );
}
