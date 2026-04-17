/**
 * 🚀 API Principal - Servidor Express com Supabase
 * Gerencia todas as rotas da aplicação
 */
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Importar controllers
import { handleCadastro, handleLogin } from './controllers/authController.js';
import {
    handleGetComentarios,
    handleCreateComentario,
    handleReactComentario,
    handlePinComentario,
    handleUpdateComentario,
    handleDeleteMyComentario,
    handleDeleteComentario
} from './controllers/comentariosController.js';
import {
    handleGetGaleriaComentarios,
    handleCreateGaleriaComentario,
    handleDeleteGaleriaComentario
} from './controllers/galeriaController.js';
import {
    handleRenameUsuario,
    handleGetUsuarios,
    handleCreateAdminRequest,
    handleGetAdminRequests,
    handleReviewAdminRequest,
    handleGetSiteStatus,
    handleUpdateSiteStatus
} from './controllers/adminController.js';
import {
    handleGetGaleria,
    handleCreateGaleria,
    handleVideoUpload,
    handleUpdateGaleria,
    handleReorderGaleria,
    handleDeleteGaleria
} from './controllers/videosController.js';
import {
    handleGetDescricaoTurma,
    handleUpdateDescricaoTurma,
    handleGetCalendario,
    handleCreateCalendarioEvent,
    handleUpdateCalendarioEvent,
    handleDeleteCalendarioEvent,
    handleDeleteUsuario
} from './controllers/configController.js';
import {
    handleGetLogs,
    handleCreateLog,
    handleDeleteLogs,
    handleDeleteLogById,
    handleGetDatabaseTables,
    handleGetTableData
} from './controllers/logsController.js';

// Importar utilitários
import { isAdminToken, isRootAdminToken } from './utils/helpers.js';
import {
    ensureGaleriaPositions,
    ensureGaleriaTipoMidia,
    ensureGaleriaStorageKey,
    getDescricaoAtual,
    getAppSetting,
    setAppSetting,
    promoteUserToAdmin
} from './utils/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const GALERIA_PAGE_SIZE = 5;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

if (!supabase) {
    console.error('❌ Supabase não configurado. Verifique SUPABASE_URL e SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY.');
    app.use('/api', (req, res) => {
        res.status(500).json({
            error: 'Supabase não configurado no servidor. Verifique SUPABASE_URL e SUPABASE_KEY/SUPABASE_SERVICE_ROLE_KEY nas variáveis de ambiente do Vercel.'
        });
    });
}

// Função para criar logs (stub)
async function createLog(categoria, acao, descricao) {
    try {
        if (!supabase) return;
        await supabase
            .from('logs')
            .insert([{ categoria, acao, descricao, timestamp: new Date().toISOString() }]);
    } catch (err) {
        // Silenciosamente falha se tabela não existe
        if (!err.code || err.code !== 'PGRST205') {
            console.warn('⚠️  Erro ao criar log:', err.message);
        }
    }
}

// Helper para verificar se token é root admin
function isRootAdminToken(req) {
    const token = req.headers['x-admin-token'];
    return token === 'turma205-admin';
}

// ===== HEALTH CHECK E DEBUG =====
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        supabaseConfigured: !!process.env.SUPABASE_URL
    });
});

app.get('/api/debug/routes', (req, res) => {
    res.json({
        message: 'API routes disponíveis',
        auth: [
            'POST /api/cadastro',
            'POST /api/login'
        ],
        comentarios: [
            'GET /api/comentarios',
            'POST /api/comentarios',
            'POST /api/comentarios/:id/react',
            'PUT /api/comentarios/:id/pin',
            'PUT /api/comentarios/:id',
            'DELETE /api/comentarios/meus/:id',
            'DELETE /api/comentarios/:id'
        ],
        galeria_comentarios: [
            'GET /api/galeria/:galeriaId/comentarios',
            'POST /api/galeria/:galeriaId/comentarios',
            'DELETE /api/galeria/comentarios/:comentarioId'
        ],
        usuarios: [
            'GET /api/usuarios',
            'PUT /api/usuarios/renomear',
            'DELETE /api/usuarios'
        ],
        admin: [
            'POST /api/admin-requests',
            'GET /api/admin-requests',
            'PUT /api/admin-requests/:id'
        ],
        galeria: [
            'GET /api/galeria',
            'POST /api/galeria',
            'POST /api/galeria/video-upload',
            'PUT /api/galeria/:id',
            'PUT /api/galeria/reorder',
            'DELETE /api/galeria/:id'
        ],
        config: [
            'GET /api/descricao-turma',
            'POST /api/descricao-turma',
            'GET /api/calendario',
            'POST /api/calendario',
            'PUT /api/calendario/:id',
            'DELETE /api/calendario/:id',
            'GET /api/site-status',
            'PUT /api/site-status'
        ]
    });
});

// ===== ROTAS DE AUTENTICAÇÃO =====
app.post('/api/cadastro', handleCadastro(supabase, createLog));
app.post('/api/login', handleLogin(supabase, createLog));

// ===== ROTAS DE COMENTÁRIOS =====
app.get('/api/comentarios', handleGetComentarios(supabase));
app.post('/api/comentarios', handleCreateComentario(supabase));
app.post('/api/comentarios/:id/react', handleReactComentario(supabase));
app.put('/api/comentarios/:id/pin', handlePinComentario(supabase));
app.put('/api/comentarios/:id', handleUpdateComentario(supabase));
app.delete('/api/comentarios/meus/:id', handleDeleteMyComentario(supabase));
app.delete('/api/comentarios/:id', handleDeleteComentario(supabase));

// ===== ROTAS DE COMENTÁRIOS DE GALERIA =====
app.get('/api/galeria/:galeriaId/comentarios', handleGetGaleriaComentarios(supabase));
app.post('/api/galeria/:galeriaId/comentarios', handleCreateGaleriaComentario(supabase));
app.delete('/api/galeria/comentarios/:comentarioId', handleDeleteGaleriaComentario(supabase));

// ===== ROTAS DE USUÁRIOS =====
app.put('/api/usuarios/renomear', handleRenameUsuario(supabase));
app.get('/api/usuarios', handleGetUsuarios(supabase));
app.delete('/api/usuarios', handleDeleteUsuario(supabase, createLog));

// ===== ROTAS DE ADMIN =====
app.post('/api/admin-requests', handleCreateAdminRequest(supabase));
app.get('/api/admin-requests', handleGetAdminRequests(supabase, isRootAdminToken));
app.put('/api/admin-requests/:id', handleReviewAdminRequest(supabase, isRootAdminToken, (userId) => promoteUserToAdmin(supabase, userId)));

// ===== ROTAS DE DESCRIÇÃO E CONFIG =====
app.get('/api/descricao-turma', handleGetDescricaoTurma(supabase, getDescricaoAtual));
app.post('/api/descricao-turma', handleUpdateDescricaoTurma(supabase, getDescricaoAtual, createLog));

// ===== ROTAS DE CALENDÁRIO =====
app.get('/api/calendario', handleGetCalendario(supabase));
app.post('/api/calendario', handleCreateCalendarioEvent(supabase, createLog));
app.put('/api/calendario/:id', handleUpdateCalendarioEvent(supabase, createLog));
app.delete('/api/calendario/:id', handleDeleteCalendarioEvent(supabase, createLog));

// ===== ROTAS DE SITE STATUS =====
app.get('/api/site-status', handleGetSiteStatus(supabase, getAppSetting));
app.put('/api/site-status', handleUpdateSiteStatus(supabase, setAppSetting, isRootAdminToken));

// ===== ROTAS DE GALERIA =====
app.get('/api/galeria', handleGetGaleria(supabase));
app.post('/api/galeria', handleCreateGaleria(supabase));
app.post('/api/galeria/video-upload', handleVideoUpload(supabase));
app.put('/api/galeria/:id', handleUpdateGaleria(supabase));
app.put('/api/galeria/reorder', handleReorderGaleria(supabase));
app.delete('/api/galeria/:id', handleDeleteGaleria(supabase));

// ===== ROTAS DE LOGS =====
app.get('/api/logs', handleGetLogs(supabase));
app.post('/api/logs', handleCreateLog(supabase));
app.delete('/api/logs', handleDeleteLogs(supabase));
app.delete('/api/logs/:id', handleDeleteLogById(supabase));

// ===== ROTAS DE DATABASE =====
app.get('/api/database/tables', handleGetDatabaseTables(supabase));
app.get('/api/database/table/:tableName', handleGetTableData(supabase));

// ===== 404 =====
app.use((req, res) => {
    res.status(404).json({
        error: 'Rota não encontrada',
        path: req.path,
        method: req.method,
        hint: 'Visite GET /api/debug/routes para listar rotas disponíveis'
    });
});

// ===== EXPORTAR PARA VERCEL =====
export default app;
