import express from 'express';
import * as galeriaController from '../controllers/galeriaController.js';
import * as comentariosController from '../controllers/comentariosController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Listar galeria
router.get('/', galeriaController.listGaleria);

// Upload de vídeo (admin)
router.post('/video-upload', requireAdmin, galeriaController.uploadVideo);

// Adicionar mídia (admin)
router.post('/', requireAdmin, galeriaController.addMidia);

// Atualizar mídia (admin)
router.put('/:id', requireAdmin, galeriaController.updateMidia);

// Reordenar galeria (admin)
router.put('/reorder', requireAdmin, galeriaController.reorderGaleria);

// Deletar mídia (admin)
router.delete('/:id', requireAdmin, galeriaController.deleteMidia);

// Listar comentários de mídia
router.get('/:galeriaId/comentarios', comentariosController.listComentariosGaleria);

// Criar comentário em mídia
router.post('/:galeriaId/comentarios', comentariosController.createComentarioGaleria);

// Deletar comentário de mídia
router.delete('/comentarios/:comentarioId', comentariosController.deleteComentarioGaleria);

export default router;
