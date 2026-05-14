import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cambia esta línea para que use la misma ruta que en index.js
// En lugar de '../../.env', usa directamente '.env' porque el archivo está en la misma carpeta
dotenv.config({ path: resolve(__dirname, '.env') });

const router = express.Router();

// Leer API Key desde .env
const DOG_API_KEY = process.env.DOG_API_KEY;

console.log(' DOG API Proxy cargado');
console.log(' __dirname:', __dirname);
console.log('DOG_API_KEY configurada:', !!DOG_API_KEY);
if (DOG_API_KEY) {
    console.log('DOG_API_KEY prefix:', DOG_API_KEY.substring(0, 20) + '...');
} else {
    console.warn('⚠️ ADVERTENCIA: DOG_API_KEY no encontrada en .env');
}

// Endpoint para verificar el estado del PAT
router.get('/status', async (req, res) => {
    try {
        console.log(' Verificando estado de Dog API...');
        
        if (!DOG_API_KEY) {
            console.error(' DOG_API_KEY no existe en process.env');
            return res.status(401).json({ 
                authenticated: false, 
                error: 'API Key no configurada en .env' 
            });
        }
        
        
        
        // Probar la API Key con una consulta simple
        const response = await fetch('https://api.thedogapi.com/v1/breeds?limit=1', {
            headers: {
                'x-api-key': DOG_API_KEY
            }
        });
        
        console.log(' Respuesta de The Dog API:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(' Error response:', errorText);
            return res.status(response.status).json({
                authenticated: false,
                status: response.status,
                error: errorText
            });
        }
        
        const data = await response.json();
        console.log(' Autenticación exitosa');
        
        res.json({
            authenticated: true,
            status: response.status,
            api_key_prefix: DOG_API_KEY.substring(0, 15) + '...',
            message: 'Autenticación exitosa',
            test_response: data.length > 0 ? 'OK' : 'No data'
        });
    } catch (error) {
        console.error(' Error en /status:', error.message);
        res.status(500).json({ 
            authenticated: false, 
            error: error.message,
            stack: error.stack
        });
    }
});

// Obtener todas las razas de perros
router.get('/breeds', async (req, res) => {
    const { limit = 100, page = 0 } = req.query;
    
    if (!DOG_API_KEY) {
        return res.status(401).json({ error: 'API Key no configurada en .env' });
    }
    
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    try {
        const url = `https://api.thedogapi.com/v1/breeds?limit=${limit}&page=${page}`;
        console.log('🐕 Fetching breeds from:', url);
        
        const response = await fetch(url, {
            headers: {
                'x-api-key': DOG_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        const breeds = data.map(breed => ({
            id: breed.id,
            name: breed.name,
            temperament: breed.temperament || 'No especificado',
            life_span: breed.life_span || 'No especificado',
            weight_metric: breed.weight?.metric || 'No especificado',
            height_metric: breed.height?.metric || 'No especificado',
            image_url: breed.image?.url || null,
            origin: breed.origin || 'Desconocido',
            bred_for: breed.bred_for || 'No especificado'
        }));
        
        console.log(` Devolviendo ${breeds.length} razas`);
        res.json({
            success: true,
            total: breeds.length,
            breeds: breeds
        });
    } catch (error) {
        console.error(' Error fetching breeds:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener estadísticas de temperamentos
router.get('/temperament-stats', async (req, res) => {
    if (!DOG_API_KEY) {
        return res.status(401).json({ error: 'API Key no configurada en .env' });
    }
    
    try {
        const response = await fetch('https://api.thedogapi.com/v1/breeds?limit=200', {
            headers: {
                'x-api-key': DOG_API_KEY
            }
        });
        
        const breeds = await response.json();
        
        const temperamentCount = {};
        breeds.forEach(breed => {
            if (breed.temperament) {
                const temperaments = breed.temperament.split(',').map(t => t.trim());
                temperaments.forEach(temp => {
                    temperamentCount[temp] = (temperamentCount[temp] || 0) + 1;
                });
            }
        });
        
        const sortedTemperaments = Object.entries(temperamentCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        res.json({
            success: true,
            total_breeds: breeds.length,
            top_temperaments: sortedTemperaments.map(([name, count]) => ({ name, count }))
        });
    } catch (error) {
        console.error(' Error getting temperament stats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener imagen aleatoria de un perro
router.get('/random-image', async (req, res) => {
    if (!DOG_API_KEY) {
        return res.status(401).json({ error: 'API Key no configurada en .env' });
    }
    
    try {
        const response = await fetch('https://api.thedogapi.com/v1/images/search', {
            headers: {
                'x-api-key': DOG_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        res.json({
            success: true,
            image_url: data[0]?.url,
            breed_id: data[0]?.breeds?.[0]?.id,
            breed_name: data[0]?.breeds?.[0]?.name
        });
    } catch (error) {
        console.error(' Error fetching random image:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtener imagen por raza específica
router.get('/breed-image/:breedId', async (req, res) => {
    const { breedId } = req.params;
    
    if (!DOG_API_KEY) {
        return res.status(401).json({ error: 'API Key no configurada en .env' });
    }
    
    try {
        const url = `https://api.thedogapi.com/v1/images/search?breed_ids=${breedId}&limit=1`;
        const response = await fetch(url, {
            headers: {
                'x-api-key': DOG_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        res.json({
            success: true,
            image_url: data[0]?.url,
            breed_id: breedId
        });
    } catch (error) {
        console.error(' Error fetching breed image:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;