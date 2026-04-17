import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Cadastro
router.post('/cadastro', authController.cadastro);

// Login
router.post('/login', authController.login);

export default router;
