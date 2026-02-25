const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// IMPORTAMOS TU FUNCIÓN DESDE LA RAÍZ
const fmgp = require('./index-FMGP.js');

app.get('/samples/FMGP', (req, res) => {
    try {
        // EJECUTAMOS TU FUNCIÓN
        const resultado = fmgp.calcularMediaCheaters();
        
        // DEVOLVEMOS EL RESULTADO COMO JSON
        res.json({
            alumno: "FMGP",
            pais: resultado.FiltroPais,
            campo: resultado.CampoNumerico,
            media: resultado.media,
            registros_analizados: resultado.filaCountry.length,
            datos_utilizados: resultado.filaCountry
        });
    } catch (error) {
        console.error("Error en /samples/FMGP:", error);
        res.status(500).json({ 
            error: "Error al calcular la media",
            detalle: error.message 
        });
    }
});

// RUTA RAÍZ (opcional)
app.get('/', (req, res) => {
    res.json({ 
        message: 'API SOS2526-30 funcionando',
        rutas_disponibles: ['/samples/FMGP']
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Prueba tu ruta: /samples/FMGP`);
});