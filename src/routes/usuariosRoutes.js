import express from 'express';
import * as usuariosController from '../controllers/usuariosController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Listar usuários (admin)
router.get('/', requireAdmin, usuariosController.listUsers);

// Renomear usuário (admin)
router.put('/renomear', requireAdmin, usuariosController.renameUser);

// Alterar nome (user)
router.post('/:id/alterar-nome', usuariosController.alterarNome);

// Alterar senha (user)
router.post('/:id/alterar-senha', usuariosController.alterarSenha);

// Deletar conta (user - contas comuns apenas)
router.delete('/:id', usuariosController.deletarConta);

export default router;
