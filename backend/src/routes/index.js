import { Router } from 'express';
import authRoutes from './auth.routes.js';
import veiculoRoutes from './veiculo.routes.js';
import locacaoRoutes from './locacao.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/veiculos', veiculoRoutes);
router.use('/locacoes', locacaoRoutes);

export default router;
