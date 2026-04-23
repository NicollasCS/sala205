import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { requireAdmin, requireRoot, requireDev } from '../middleware/auth.js';

const router = express.Router();

// Admin Requests
router.post('/admin-requests', requireAdmin, adminController.createAdminRequest);
router.get('/admin-requests', requireAdmin, adminController.listAdminRequests);
router.put('/admin-requests/:id', requireRoot, adminController.reviewAdminRequest);

// Site Status
router.get('/site-status', adminController.getSiteStatus);
router.put('/site-status', requireRoot, adminController.updateSiteStatus);

// Descrição da Turma
router.get('/descricao-turma', adminController.getDescricao);
router.post('/descricao-turma', requireAdmin, adminController.updateDescricao);

// Logs
router.get('/logs', requireAdmin, adminController.listLogs);
router.post('/logs', requireAdmin, adminController.createLogManual);
router.delete('/logs', requireAdmin, adminController.deleteLogs);

// Database
router.get('/database/tables', requireAdmin, adminController.listTables);
router.get('/database/table/:tableName', requireAdmin, adminController.getTableData);
router.delete('/database/table/:tableName/row/:id', requireDev, adminController.deleteTableRow);

// Verificar Sessão
router.get('/verify', adminController.verifySession);

// Login
router.post('/login', adminController.login);

export default router;
