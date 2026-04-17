import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Cadastro
router.post('/cadastro', authController.cadastro);

// Login de usuário
router.post('/login', authController.login);

// Login de admin (com cookie HttpOnly)
router.post('/admin/login', authController.loginAdmin);

// Verificar sessão de admin
router.get('/admin/verify', authController.verifyAdminSession);

// Logout de admin
router.post('/admin/logout', authController.logoutAdmin);

export default router;
