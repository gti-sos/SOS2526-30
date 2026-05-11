import express from 'express';

const router = express.Router();

// Base URL de CoinGecko API
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3';

// Middleware de logging
router.use((req, res, next) => {
    console.log(`[GGG-CRYPTO-PROXY] ${req.method} ${req.url}`);
    next();
});

// Endpoint para obtener precio de criptomonedas
router.get('/price', async (req, res) => {
    const { ids, vs_currencies } = req.query;
    
    if (!ids || !vs_currencies) {
        return res.status(400).json({ 
            error: 'Faltan parámetros. Se requieren: ids (ej: bitcoin) y vs_currencies (ej: usd)' 
        });
    }
    
    const url = `${COINGECKO_API_URL}/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`;
    
    console.log(`[GGG-CRYPTO-PROXY] Llamando a: ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SOS2526-30-App'
            }
        });
        
        if (!response.ok) {
            console.error(`[GGG-CRYPTO-PROXY] Error ${response.status}: ${response.statusText}`);
            return res.status(response.status).json({ 
                error: `CoinGecko API error: ${response.status}` 
            });
        }
        
        const data = await response.json();
        console.log(`[GGG-CRYPTO-PROXY] Respuesta recibida para: ${ids}`);
        
        // Cache headers (5 minutos)
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json(data);
        
    } catch (error) {
        console.error('[GGG-CRYPTO-PROXY] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para obtener lista de monedas soportadas
router.get('/coins/list', async (req, res) => {
    const url = `${COINGECKO_API_URL}/coins/list`;
    
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'SOS2526-30-App'
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: `CoinGecko API error: ${response.status}` });
        }
        
        const data = await response.json();
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
        res.json(data);
        
    } catch (error) {
        console.error('[GGG-CRYPTO-PROXY] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para verificar estado del proxy
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'GGG-crypto-proxy',
        url: '/api/crypto-proxy',
        timestamp: new Date().toISOString()
    });
});

export default router;