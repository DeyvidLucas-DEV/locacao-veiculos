import 'dotenv/config';

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET ||= 'chave-de-teste';

const { default: app } = await import('../src/app.js');
const porta = Number(process.env.TEST_PORT) || 3334;

app.listen(porta, () => {
  console.log(`API de testes disponível em http://localhost:${porta}/api`);
});
