import express from 'express';

const router = express.Router();

// Base URL de Random User API
const RANDOM_USER_API_URL = 'https://randomuser.me/api';

// Middleware de logging
router.use((req, res, next) => {
    next();
});

// Endpoint para obtener usuario aleatorio (SIEMPRE diferente)
router.get('/user', async (req, res) => {
    
    const { seed } = req.query;
    const seedValue = seed || Date.now();
    const url = `${RANDOM_USER_API_URL}/?results=1&seed=${seedValue}`;

    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SOS2526-30-App'
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: `Random User API error: ${response.status}` });
        }
        
        const data = await response.json();
        
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(data);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para verificar estado del proxy
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'GGG-random-proxy',
        url: '/api/random-proxy',
        timestamp: new Date().toISOString()
    });
});

export default router;