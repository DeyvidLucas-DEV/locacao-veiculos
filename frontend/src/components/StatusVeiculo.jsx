export default function StatusVeiculo({ disponivel }) {
  return (
    <span className={`status ${disponivel ? 'status-livre' : 'status-ocupado'}`}>
      {disponivel ? 'Disponível' : 'Locado'}
    </span>
  );
}
