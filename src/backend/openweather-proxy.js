// src/backend/openweather-proxy.js
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('📁 __dirname:', __dirname);
console.log('📁 Buscando .env en:', resolve(__dirname, '../../.env'));

dotenv.config({ path: resolve(__dirname, '../../.env') });
dotenv.config({ path: resolve(__dirname, '.env') });

const router = express.Router();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

console.log('🌤️ OpenWeather API Proxy cargado');
console.log('🔑 OPENWEATHER_API_KEY existe:', !!OPENWEATHER_API_KEY);
console.log('🔑 OPENWEATHER_API_KEY valor:', OPENWEATHER_API_KEY ? OPENWEATHER_API_KEY.substring(0, 5) + '...' : 'NO ENCONTRADA');

// Endpoint de prueba
router.get('/debug', (req, res) => {
    res.json({ 
        hasKey: !!OPENWEATHER_API_KEY, 
        keyPrefix: OPENWEATHER_API_KEY ? OPENWEATHER_API_KEY.substring(0, 5) : null
    });
});

// Endpoint de status
router.get('/status', async (req, res) => {
    try {
        if (!OPENWEATHER_API_KEY) {
            return res.status(401).json({ 
                authenticated: false, 
                error: 'API Key no encontrada'
            });
        }
        
        const url = `https://api.openweathermap.org/data/2.5/weather?q=Madrid&appid=${OPENWEATHER_API_KEY}&units=metric`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ 
                authenticated: false, 
                status: response.status,
                error: errorText 
            });
        }
        
        const data = await response.json();
        
        res.json({
            authenticated: true,
            status: response.status,
            city: data.name,
            temp: data.main?.temp,
            api_key_prefix: OPENWEATHER_API_KEY.substring(0, 5) + '...'
        });
    } catch (error) {
        console.error('❌ Error en status:', error.message);
        res.status(500).json({ authenticated: false, error: error.message });
    }
});

// Obtener clima actual
router.get('/weather', async (req, res) => {
    const { city = 'Madrid', units = 'metric' } = req.query;
    
    if (!OPENWEATHER_API_KEY) {
        return res.status(401).json({ error: 'API Key no configurada' });
    }
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=${units}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        res.json({
            success: true,
            city: data.name,
            country: data.sys?.country,
            temperature: data.main?.temp,
            feels_like: data.main?.feels_like,
            humidity: data.main?.humidity,
            pressure: data.main?.pressure,
            wind_speed: data.wind?.speed,
            description: data.weather?.[0]?.description,
            icon: data.weather?.[0]?.icon
        });
    } catch (error) {
        console.error('❌ Error fetching weather:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// 🔴 ENDPOINT ELIMINADO: /yearly-temperatures (tenía datos precargados)
// Si necesitas temperaturas históricas, deben venir de un fetch real a una API
// Por ejemplo, podrías usar la API de OpenWeather historical data (requiere plan de pago)

// Pronóstico 5 días
router.get('/forecast', async (req, res) => {
    const { city = 'Madrid', units = 'metric', limit = 40 } = req.query;
    
    if (!OPENWEATHER_API_KEY) {
        return res.status(401).json({ error: 'API Key no configurada' });
    }
    
    try {
        const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=${units}&cnt=${limit}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        const dailyForecast = {};
        data.list.forEach(item => {
            const date = item.dt_txt.split(' ')[0];
            if (!dailyForecast[date]) {
                dailyForecast[date] = {
                    date: date,
                    temp_min: item.main.temp_min,
                    temp_max: item.main.temp_max,
                    humidity: item.main.humidity,
                    description: item.weather[0].description,
                    icon: item.weather[0].icon
                };
            } else {
                dailyForecast[date].temp_min = Math.min(dailyForecast[date].temp_min, item.main.temp_min);
                dailyForecast[date].temp_max = Math.max(dailyForecast[date].temp_max, item.main.temp_max);
            }
        });
        
        res.json({
            success: true,
            city: data.city.name,
            country: data.city.country,
            forecast: Object.values(dailyForecast).slice(0, 5)
        });
    } catch (error) {
        console.error('❌ Error fetching forecast:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;