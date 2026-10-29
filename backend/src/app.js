import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/tratarErros.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/api', routes);
app.use(rotaNaoEncontrada);
app.use(tratarErros);

export default app;
