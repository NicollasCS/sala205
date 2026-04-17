import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { requireAdmin, requireDev } from '../middleware/auth.js';

const router = express.Router();

// ========== LOGS ROUTES ==========
router.get('/', requireAdmin, adminController.listLogs);
router.post('/', requireAdmin, adminController.createLogManual);
router.delete('/', requireAdmin, adminController.deleteLogs);
router.delete('/:id', requireAdmin, adminController.deleteLogById);

export default router;
