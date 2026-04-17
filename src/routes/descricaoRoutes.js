import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ========== DESCRIÇÃO TURMA ROUTES ==========
router.get('/', adminController.getDescricao);
router.post('/', requireAdmin, adminController.updateDescricao);

export default router;
