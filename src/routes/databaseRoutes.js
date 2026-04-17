import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ========== DATABASE ROUTES ==========
router.get('/tables', requireAdmin, adminController.listTables);
router.get('/table/:tableName', requireAdmin, adminController.getTableData);

export default router;
