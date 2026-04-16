// Handler minimalista para /api/health - sem dependências
module.exports = (req, res) => {
    try {
        if (req.method === 'GET') {
            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'unknown',
                supabaseUrl: process.env.SUPABASE_URL ? 'configured' : 'not-configured'
            });
        } else {
            res.status(405).json({ error: 'Método não permitido' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
