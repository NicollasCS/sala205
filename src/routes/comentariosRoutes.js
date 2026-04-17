import express from 'express';
import * as comentariosController from '../controllers/comentariosController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Listar comentários
router.get('/', comentariosController.listComentarios);

// Criar comentário
router.post('/', comentariosController.createComentario);

// Reação em comentário
router.post('/:id/react', comentariosController.reagirComentario);

// Fixar/desafixar comentário (admin)
router.put('/:id/pin', requireAdmin, comentariosController.pinComentario);

// Atualizar comentário (admin)
router.put('/:id', requireAdmin, comentariosController.updateComentario);

// Deletar comentário próprio
router.delete('/meus/:id', comentariosController.deleteComentarioSeu);

// Deletar comentário (admin)
router.delete('/:id', requireAdmin, comentariosController.deleteComentario);

export default router;
