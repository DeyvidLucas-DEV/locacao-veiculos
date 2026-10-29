import { Router } from 'express';
import * as locacaoController from '../controllers/locacao.controller.js';
import autenticar from '../middlewares/autenticar.js';

const router = Router();

router.use(autenticar);
router.post('/', locacaoController.registrar);
router.get('/', locacaoController.listar);
router.patch('/:id/finalizar', locacaoController.finalizar);

export default router;
