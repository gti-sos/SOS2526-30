import axios from 'axios';

export default function loadCitysStatsProxy(app) {
    
    console.log('=== CARGANDO PROXY DE CITYS STATS (GRUPO 29) ===');
    
    app.get('/proxy/citys-stats', async (req, res) => {
        try {
            // Usamos axios exactamente igual que tus compañeros
            const response = await axios.get('https://sos2526-29.onrender.com/api/v2/citys-stats');
            
            // Con axios, los datos ya vienen en response.data (no hace falta .json())
            res.status(200).json(response.data);
            
        } catch (error) {
            console.error('❌ Error en el proxy de Citys Stats:', error.message);
            
            // Si el error viene de la API, devolvemos su código. Si no, un 500.
            const statusCode = error.response ? error.response.status : 500;
            res.status(statusCode).json({ error: error.message });
        }
    });
}
