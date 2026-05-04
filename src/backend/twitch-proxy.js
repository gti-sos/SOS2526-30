import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv para leer desde la raíz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default function loadTwitchProxy(app) {
    
    console.log('=== CARGANDO PROXY DE TWITCH API ===');
    
    // Leer credenciales desde .env
    const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
    const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
    
    console.log('TWITCH_CLIENT_ID existe?', !!TWITCH_CLIENT_ID);
    console.log('TWITCH_CLIENT_SECRET existe?', !!TWITCH_CLIENT_SECRET);
    
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
        console.warn('⚠️ ADVERTENCIA: Credenciales de Twitch no encontradas en el archivo .env');
    }
    
    let accessToken = null;
    let tokenExpiration = 0;
    
    async function getAccessToken() {
        // Si el token aún es válido
        if (accessToken && Date.now() < tokenExpiration) {
            return accessToken;
        }
        
        if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
            return null;
        }
        
        try {
            const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
                params: {
                    client_id: TWITCH_CLIENT_ID,
                    client_secret: TWITCH_CLIENT_SECRET,
                    grant_type: 'client_credentials'
                }
            });
            
            accessToken = response.data.access_token;
            // El token expira en 60 minutos, guardamos con 10 minutos de margen
            tokenExpiration = Date.now() + (response.data.expires_in - 600) * 1000;
            
            console.log('✅ Token de Twitch obtenido correctamente');
            return accessToken;
        } catch (error) {
            console.error('❌ Error obteniendo token de Twitch:', error.response?.data || error.message);
            return null;
        }
    }
    
    // 1. Proxy para obtener juegos más populares
    app.get('/api/twitch/games', async (req, res) => {
        const token = await getAccessToken();
        
        if (!token) {
            return res.status(401).json({ 
                authenticated: false,
                error: 'No se pudo obtener token de autenticación'
            });
        }
        
        try {
            const response = await axios.get('https://api.twitch.tv/helix/games/top', {
                params: { first: 20 },
                headers: {
                    'Client-ID': TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const games = response.data.data.map(game => ({
                name: game.name,
                id: game.id,
                viewers: game.viewer_count
            }));
            
            res.json({
                authenticated: true,
                games: games
            });
        } catch (error) {
            console.error('Error en Twitch API:', error.message);
            res.status(500).json({ error: error.message });
        }
    });
    
    // 2. Endpoint para verificar autenticación
    app.get('/api/twitch/status', async (req, res) => {
        const token = await getAccessToken();
        res.json({ 
            authenticated: !!token,
            message: token ? 'Credenciales configuradas correctamente' : 'Error de autenticación'
        });
    });
}