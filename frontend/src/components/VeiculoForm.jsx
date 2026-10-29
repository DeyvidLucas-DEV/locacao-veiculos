import { useState } from 'react';
import Mensagem from './Mensagem.jsx';
import { veiculosApi } from '../services/api.js';

const formularioVazio = { marca: '', modelo: '', placa: '', ano: '', valorDiaria: '' };

function validarFormulario({ marca, modelo, placa, ano, valorDiaria }) {
  if (!marca.trim() || !modelo.trim()) {
    return 'Preencha marca e modelo.';
  }
  if (placa.replace(/[^a-zA-Z0-9]/g, '').length !== 7) {
    return 'A placa deve ter 7 caracteres, por exemplo ABC1234 ou ABC1D23.';
  }
  if (!Number.isInteger(Number(ano))) {
    return 'Informe um ano válido.';
  }
  if (!(Number(valorDiaria) > 0)) {
    return 'O valor da diária deve ser maior que zero.';
  }
  return '';
}

export default function VeiculoForm({ aoCadastrar }) {
  const [formulario, setFormulario] = useState(formularioVazio);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  function atualizarCampo(evento) {
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value });
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErro('');
    setSucesso('');

    const erroValidacao = validarFormulario(formulario);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setEnviando(true);
    try {
      const veiculo = await veiculosApi.cadastrar({
        ...formulario,
        ano: Number(formulario.ano),
        valorDiaria: formulario.valorDiaria,
      });
      setFormulario(formularioVazio);
      setSucesso(`${veiculo.marca} ${veiculo.modelo} (${veiculo.placa}) cadastrado com sucesso.`);
      aoCadastrar();
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="cartao formulario" onSubmit={enviar} noValidate>
      <h2>Cadastrar veículo</h2>
      <div className="grade-campos">
        <label>
          Marca
          <input name="marca" value={formulario.marca} onChange={atualizarCampo} maxLength={60} />
        </label>
        <label>
          Modelo
          <input name="modelo" value={formulario.modelo} onChange={atualizarCampo} maxLength={80} />
        </label>
        <label>
          Placa
          <input
            name="placa"
            value={formulario.placa}
            onChange={atualizarCampo}
            maxLength={8}
            placeholder="ABC1D23"
          />
        </label>
        <label>
          Ano
          <input name="ano" type="number" value={formulario.ano} onChange={atualizarCampo} placeholder="2024" />
        </label>
        <label>
          Valor da diária (R$)
          <input
            name="valorDiaria"
            type="number"
            min="0.01"
            step="0.01"
            value={formulario.valorDiaria}
            onChange={atualizarCampo}
            placeholder="150.00"
          />
        </label>
      </div>
      <Mensagem>{erro}</Mensagem>
      <Mensagem tipo="sucesso">{sucesso}</Mensagem>
      <button type="submit" className="botao" disabled={enviando}>
        {enviando ? 'Cadastrando...' : 'Cadastrar veículo'}
      </button>
    </form>
  );
}
