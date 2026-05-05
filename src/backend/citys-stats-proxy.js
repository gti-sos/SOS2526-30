import fetch from 'node-fetch'; // O como lo tengáis importado en vuestro proyecto

const loadCitysStatsProxy = (app) => {
    // Cuando tu frontend llame a /proxy/citys-stats, este código interceptará la llamada
    app.get('/proxy/citys-stats', async (req, res) => {
        try {
            // Tu servidor hace la petición a la API del Grupo 29
            const response = await fetch('https://sos2526-29.onrender.com/api/v2/citys-stats');
            
            if (!response.ok) {
                return res.status(response.status).json({ error: 'Error al contactar con la API del G29' });
            }
            
            const data = await response.json();
            // Le devolvemos los datos limpios a tu frontend
            res.status(200).json(data);
            
        } catch (error) {
            console.error("Error en el proxy de Citys Stats:", error);
            res.status(500).json({ error: error.message });
        }
    });
};

export { loadCitysStatsProxy };