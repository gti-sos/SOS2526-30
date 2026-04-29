import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const GITHUB_TOKEN = process.env.XITHUB_TOKEN;

// Cambiar 'GET *' por 'use' (middleware)
router.use(async (req, res) => {
    const url = 'https://api.github.com' + req.url;
    
    console.log('🔵 Proxy GGG request:', req.method, url);
    
    if (!GITHUB_TOKEN) {
        console.warn('⚠️ No hay token de GitHub');
    }
    
    try {
        const headers = {
            'User-Agent': 'SOS2526-30-App',
            'Accept': 'application/vnd.github.v3+json'
        };
        
        if (GITHUB_TOKEN) {
            headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
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