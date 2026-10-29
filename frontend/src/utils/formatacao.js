const formatadorMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatadorDataHora = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export function formatarMoeda(valor) {
  return formatadorMoeda.format(Number(valor));
}

export function formatarDataHora(data) {
  return data ? formatadorDataHora.format(new Date(data)) : '';
}

export function paraCampoDataHora(data) {
  const deslocamento = data.getTimezoneOffset() * 60000;
  return new Date(data.getTime() - deslocamento).toISOString().slice(0, 16);
}
