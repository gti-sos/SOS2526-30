import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default function loadSpotifyProxy(app) {
    
    console.log('=== CARGANDO PROXY DE SPOTIFY API ===');
    
    const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    
    console.log('SPOTIFY_CLIENT_ID existe?', !!SPOTIFY_CLIENT_ID);
    console.log('SPOTIFY_CLIENT_SECRET existe?', !!SPOTIFY_CLIENT_SECRET);
    
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
        console.warn('⚠️ ADVERTENCIA: Credenciales de Spotify no encontradas');
        return;
    }
    
    let accessToken = null;
    let tokenExpiration = 0;
    
    async function getAccessToken() {
        if (accessToken && Date.now() < tokenExpiration) {
            return accessToken;
        }
        
        try {
            const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
            
            const response = await axios.post('https://accounts.spotify.com/api/token', 
                'grant_type=client_credentials', {
                    headers: {
                        'Authorization': `Basic ${authString}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
            
            accessToken = response.data.access_token;
            tokenExpiration = Date.now() + (response.data.expires_in - 300) * 1000;
            
            console.log('✅ Token de Spotify obtenido correctamente');
            return accessToken;
        } catch (error) {
            console.error('❌ Error obteniendo token:', error.response?.data || error.message);
            return null;
        }
    }
    
    // 1. Proxy para buscar artistas
    app.get('/api/spotify/search', async (req, res) => {
        const query = req.query.q || 'gaming';
        const limit = req.query.limit || 10;
        
        const token = await getAccessToken();
        
        if (!token) {
            return res.status(401).json({ 
                authenticated: false,
                error: 'No se pudo obtener token'
            });
        }
        
        try {
            const response = await axios.get('https://api.spotify.com/v1/search', {
                params: {
                    q: query,
                    type: 'artist',
                    limit: limit
                },
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const artists = response.data.artists.items.map(artist => ({
                name: artist.name,
                popularity: artist.popularity,
                followers: artist.followers.total,
                genres: artist.genres
            }));
            
            res.json({
                authenticated: true,
                artists: artists
            });
        } catch (error) {
            console.error('Error:', error.message);
            res.status(500).json({ error: error.message });
        }
    });
    
    // 2. Endpoint para verificar autenticación
    app.get('/api/spotify/status', async (req, res) => {
        const token = await getAccessToken();
        res.json({ 
            authenticated: !!token,
            message: token ? 'Credenciales configuradas correctamente' : 'Error de autenticación'
        });
    });
}