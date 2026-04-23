import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Importar routers
import apiRoutes from './routes/index.js';

// Importar middleware e config
import { errorHandler } from './middleware/auth.js';
import { PORT } from './config/constants.js';
import { supabase } from './utils/supabase.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ========== MIDDLEWARE GLOBAL ==========
app.use(cors({
    origin: true,           // Aceitar qualquer origem (pode ser customizado para localhost)
    credentials: true       // Permitir envio de cookies
}));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// ========== HEALTH CHECK RAIZ ==========
app.get('/', (req, res) => {
    res.json({ 
        message: 'API Sala 205 ativa',
        version: '1.0.0',
        status: 'ok'
    });
});

// ========== ROTAS DA API ==========
app.use('/api', apiRoutes);

// ========== ERROR HANDLER ==========
app.use(errorHandler);

// ========== INICIALIZAR SERVIDOR ==========
const server = app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    if (supabase) {
        console.log('✅ Supabase conectado');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor...');
    server.close(() => {
        console.log('Servidor encerrado');
        process.exit(0);
    });
});

export default app;
