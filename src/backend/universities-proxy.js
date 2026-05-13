import axios from 'axios';

export default function loadUniversitiesEsportsProxy(app) {
    
    console.log('=== CARGANDO PROXY DE UNIVERSIDADES (eSports Growth) ===');
    
    app.get('/api/v1/esportsgrowth-stats/universities/:country', async (req, res) => {
        const country = req.params.country;
        
        try {
            // Llamamos a la API pública de universidades
            const response = await axios.get(`http://universities.hipolabs.com/search?country=${country}`);
            
            // La API devuelve un array con todas las universidades, contamos cuántas hay (.length)
            res.json({
                country: country,
                universitiesCount: response.data.length || 0
            });

        } catch (error) {
            console.error("❌ Error en proxy de Universidades:", error.message);
            res.status(500).json({ error: "Error conectando con la API de Universidades" });
        }
    });
}