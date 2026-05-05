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
    
    async function getAccessToken() {
        if (accessToken) return accessToken;
        
        try {
            const authString = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
            
            const response = await axios.post('https://accounts.spotify.com/api/token', 
                'grant_type=client_credentials', {
                    headers: {
                        'Authorization': `Basic ${authString}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'User-Agent': 'SOS2526-30-App/1.0'
                    }
                });
            
            accessToken = response.data.access_token;
            console.log('✅ Token de Spotify obtenido');
            return accessToken;
        } catch (error) {
            console.error('❌ Error obteniendo token:', error.response?.data || error.message);
            return null;
        }
    }
    
    app.get('/api/spotify/search', async (req, res) => {
        const token = await getAccessToken();
        
        if (!token) {
            return res.status(401).json({ error: 'No se pudo obtener token' });
        }
        
        try {
            const response = await axios.get('https://api.spotify.com/v1/search', {
                params: {
                    q: 'music',
                    type: 'artist',
                    limit: 8
                },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'SOS2526-30-App/1.0',
                    'Accept': 'application/json'
                }
            });
            
            const artists = response.data.artists.items.map(artist => ({
                name: artist.name,
                popularity: artist.popularity,
                followers: artist.followers.total
            }));
            
            console.log(`✅ ${artists.length} artistas encontrados`);
            res.json({ authenticated: true, artists: artists });
        } catch (error) {
            console.error('❌ Error:', error.response?.data || error.message);
            res.status(500).json({ error: error.message, details: error.response?.data });
        }
    });
    
    app.get('/api/spotify/status', async (req, res) => {
        const token = await getAccessToken();
        res.json({ authenticated: !!token });
    });
}