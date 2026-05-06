import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar dotenv para leer el .env desde la raíz del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Ajusta esta ruta de '../..' si tu archivo está más profundo o más superficial
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export default function loadGithubEsportsProxy(app) {
    
    console.log('=== CARGANDO PROXY OAUTH DE GITHUB (eSports Growth) ===');
    
    // 1. Definimos la ruta de tu proxy
    app.get('/api/v1/esportsgrowth-stats/github/:country', async (req, res) => {
        const country = req.params.country;
        
        // Leemos el token desde el .env
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 

        try {
            // Configuramos las cabeceras
            const config = {
                headers: {
                    'User-Agent': 'SOS-App-eSports' // Obligatorio para la API de GitHub
                }
            };

            // MAGIA OAUTH: Si existe el token, lo inyectamos de forma segura
            if (GITHUB_TOKEN) {
                config.headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
            } else {
                console.warn('⚠️ GITHUB_TOKEN no encontrado. La petición a GitHub irá sin autenticar (riesgo de límite de peticiones).');
            }

            // Hacemos la llamada real a la API de GitHub
            const response = await axios.get(`https://api.github.com/search/users?q=location:${country}`, config);
            
            // Devolvemos el dato limpio a tu frontend en Svelte
            res.json({
                country: country,
                developers: response.data.total_count || 0
            });

        } catch (error) {
            console.error("❌ Error en proxy de GitHub (eSports):", error.response?.data?.message || error.message);
            res.status(error.response?.status || 500).json({ 
                error: "Error conectando con GitHub",
                details: error.response?.data?.message || error.message
            });
        }
    });
}