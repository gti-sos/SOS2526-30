import express from 'express';

const router = express.Router();

const XITHUB_TOKEN = process.env.XITHUB_TOKEN;

console.log('🔍 Valor de XITHUB_TOKEN:', XITHUB_TOKEN ? '✅ Cargado correctamente' : '❌ No cargado - undefined');
console.log('🔍 Variable de entorno:', process.env.XITHUB_TOKEN);

router.use(async (req, res) => {
    const url = 'https://api.github.com' + req.url;
    
    console.log('🔵 Proxy GGG request:', req.method, url);
    
    if (!XITHUB_TOKEN) {
        console.warn('⚠️ No hay token de GitHub');
    }
    
    // AÑADIDO: Headers para evitar caché en Render
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
        const headers = {
            'User-Agent': 'SOS2526-30-App',
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (XITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${XITHUB_TOKEN}`;
        }
        
        const response = await fetch(url, { headers });
        const data = await response.json();
        
        const remaining = response.headers.get('x-ratelimit-remaining');
        console.log(`📊 Rate limit remaining: ${remaining}`);
        
        res.status(response.status).json(data);
    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;