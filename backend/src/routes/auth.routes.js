import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import autenticar from '../middlewares/autenticar.js';

const router = Router();

router.post('/register', authController.registrar);
router.post('/login', authController.login);
router.get('/me', autenticar, authController.usuarioAutenticado);

export default router;
