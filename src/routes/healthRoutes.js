import express from 'express';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        supabaseConfigured: !!process.env.SUPABASE_URL
    });
});

export default router;
