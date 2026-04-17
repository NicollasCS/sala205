import express from 'express';
import * as textosController from '../controllers/textosController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ========== TEXTOS PAGINA ROUTES ==========
router.get('/', textosController.getTextos);
router.post('/', requireAdmin, textosController.updateTextos);

export default router;
