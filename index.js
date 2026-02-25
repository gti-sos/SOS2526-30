const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// Importamos la función desde index-FMGP.js
const fmgp = require('./index-FMGP.js');

app.get('/samples/FMGP', (req, res) => {
    try {
        // Usamos la función importada
        const resultado = fmgp.calcularMediaCheaters();
        res.json({
            alumno: "FMGP",
            pais: resultado.FiltroPais,
            campo: resultado.CampoNumerico,
            media: resultado.media,
            registros_analizados: resultado.filaCountry.length,
            datos_utilizados: resultado.filaCountry
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/', (req, res) => {
    res.json({ message: 'API funcionando', ruta: '/samples/FMGP' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});