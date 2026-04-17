import express from 'express';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import usuariosRoutes from './usuariosRoutes.js';
import calendarioRoutes from './calendarioRoutes.js';
import galeriaRoutes from './galeriaRoutes.js';
import comentariosRoutes from './comentariosRoutes.js';
import adminRoutes from './adminRoutes.js';
import logsRoutes from './logsRoutes.js';
import databaseRoutes from './databaseRoutes.js';
import descricaoRoutes from './descricaoRoutes.js';

const router = express.Router();

// ========== ORGANIZAÇÃO DAS ROTAS ==========

// Health Check
router.use('/health', healthRoutes);

// Autenticação
router.use('/auth', authRoutes);

// Usuários
router.use('/usuarios', usuariosRoutes);

// Calendário
router.use('/calendario', calendarioRoutes);

// Galeria
router.use('/galeria', galeriaRoutes);

// Comentários
router.use('/comentarios', comentariosRoutes);

// Logs (direto em /api/logs)
router.use('/logs', logsRoutes);

// Database (direto em /api/database)
router.use('/database', databaseRoutes);

// Descrição Turma
router.use('/descricao-turma', descricaoRoutes);

// Admin e Sistema
router.use('/admin', adminRoutes);

// Catch-all para rotas não encontradas
router.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada', path: req.path });
});

export default router;
