import { Router } from 'express';
import * as veiculoController from '../controllers/veiculo.controller.js';
import autenticar from '../middlewares/autenticar.js';

const router = Router();

router.use(autenticar);
router.post('/', veiculoController.cadastrar);
router.get('/', veiculoController.listar);
router.get('/disponiveis', veiculoController.listarDisponiveis);

export default router;
