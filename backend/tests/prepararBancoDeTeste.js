import 'dotenv/config';
import { execSync } from 'node:child_process';

const { TEST_DATABASE_URL, DATABASE_URL } = process.env;

if (!TEST_DATABASE_URL || TEST_DATABASE_URL === DATABASE_URL) {
  console.error('Defina TEST_DATABASE_URL apontando para um banco exclusivo de testes.');
  process.exit(1);
}

execSync('npx prisma migrate deploy', {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
});
