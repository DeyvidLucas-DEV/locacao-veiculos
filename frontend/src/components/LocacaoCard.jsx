import { useState } from 'react';
import { formatarDataHora, formatarMoeda } from '../utils/formatacao.js';

export default function LocacaoCard({ locacao, finalizando, aoFinalizar }) {
  const [confirmando, setConfirmando] = useState(false);

  return (
    <article className="locacao-card">
      <header>
        <div>
          <h3>
            {locacao.veiculo.marca} {locacao.veiculo.modelo}
          </h3>
          <span className="placa">{locacao.veiculo.placa}</span>
        </div>
        <span className="status status-ocupado">Ativa</span>
      </header>
      <dl>
        <dt>Início</dt>
        <dd>{formatarDataHora(locacao.dataInicio)}</dd>
        <dt>Devolução prevista</dt>
        <dd>{formatarDataHora(locacao.dataPrevistaDevolucao)}</dd>
        <dt>Diária</dt>
        <dd>{formatarMoeda(locacao.veiculo.valorDiaria)}</dd>
        <dt>Valor total</dt>
        <dd className="valor-destaque">{formatarMoeda(locacao.valorTotal)}</dd>
      </dl>
      <footer>
        {confirmando ? (
          <>
            <span>Confirmar a devolução?</span>
            <button type="button" className="botao" disabled={finalizando} onClick={() => aoFinalizar(locacao)}>
              {finalizando ? 'Finalizando...' : 'Confirmar'}
            </button>
            <button
              type="button"
              className="botao botao-secundario"
              disabled={finalizando}
              onClick={() => setConfirmando(false)}
            >
              Cancelar
            </button>
          </>
        ) : (
          <button type="button" className="botao" onClick={() => setConfirmando(true)}>
            Finalizar locação
          </button>
        )}
      </footer>
    </article>
  );
}
