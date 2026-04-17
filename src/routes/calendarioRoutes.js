import express from 'express';
import * as calendarioController from '../controllers/calendarioController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Listar eventos
router.get('/', calendarioController.listEventos);

// Criar evento (admin)
router.post('/', requireAdmin, calendarioController.createEvento);

// Atualizar evento (admin)
router.put('/:id', requireAdmin, calendarioController.updateEvento);

// Deletar evento (admin)
router.delete('/:id', requireAdmin, calendarioController.deleteEvento);

export default router;
