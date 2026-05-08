import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const router = express.Router();

const XITHUB_TOKEN = process.env.XITHUB_TOKEN;

// Endpoint para verificar el token
router.get('/check-token', async (req, res) => {
    if (!XITHUB_TOKEN) {
        return res.json({ error: 'No token configured' });
    }
    
    try {
        const response = await fetch('https://api.github.com/rate_limit', {
            headers: {
                'Authorization': `token ${XITHUB_TOKEN}`,
                'User-Agent': 'SOS2526-30-App'
            }
        });
        
        const data = await response.json();
        
        res.json({
            token_prefix: XITHUB_TOKEN.substring(0, 10),
            status: response.status,
            rate_limit: data.rate,
            token_valid: response.status === 200
        });
    } catch (error) {
        res.json({ error: error.message });
    }
});

router.use(async (req, res) => {
    // LIMPIAR la URL para quitar /api/github si existe
    let apiPath = req.url;
    if (apiPath.startsWith('/api/github-proxy')) {
        apiPath = apiPath.replace('/api/github-proxy', '');
    }
    
    const url = 'https://api.github.com' + apiPath;
    
    console.log('🔵 Proxy GGG request:', req.method, req.url, '→', url);
    
    if (!XITHUB_TOKEN) {
        console.warn('⚠️ No hay token de GitHub');
        return res.status(500).json({ error: 'Token no configurado' });
    }
    
    // Headers para evitar caché
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
        const headers = {
            'User-Agent': 'SOS2526-30-App',
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${XITHUB_TOKEN}`
        };
        
        const response = await fetch(url, { headers });
        const data = await response.json();
        
        const remaining = response.headers.get('x-ratelimit-remaining');
        console.log(`📊 Status: ${response.status}, Rate limit remaining: ${remaining}`);
        
        if (response.status === 403) {
            console.error('❌ Error 403 - URL llamada:', url);
            console.error('Respuesta de GitHub:', JSON.stringify(data, null, 2));
        }
        
        res.status(response.status).json(data);
    } catch (error) {
        console.error('❌ Proxy error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;