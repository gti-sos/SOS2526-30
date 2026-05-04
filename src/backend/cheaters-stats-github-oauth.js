import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv para leer desde la raíz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default function loadCheatersStatsGithubOAuth(app) {
    
    console.log('=== CARGANDO PROXY CON PAT DE GITHUB ===');
    
    // Leer token desde .env
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    
    console.log('GITHUB_TOKEN existe?', !!GITHUB_TOKEN);
    
    if (!GITHUB_TOKEN) {
        console.warn('⚠️ ADVERTENCIA: No se encontró GITHUB_TOKEN en el archivo .env');
    }
    
    // 1. Proxy para obtener Pokémon
    app.get('/api/cheaters-stats/github-pokemon', async (req, res) => {
        try {
            const response = await axios.get('https://raw.githubusercontent.com/Purukitto/pokemon-data.json/master/pokedex.json');
            res.json({
                authenticated: !!GITHUB_TOKEN,
                data: response.data
            });
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).json({ error: error.message });
        }
    });
    
    // 2. Endpoint para verificar autenticación
    app.get('/api/cheaters-stats/auth/status', (req, res) => {
        res.json({ 
            authenticated: !!GITHUB_TOKEN,
            message: GITHUB_TOKEN ? 'Token configurado correctamente' : 'Token no configurado'
        });
    });
}