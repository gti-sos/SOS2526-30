const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// IMPORTAS tu algoritmo desde index-FMGP.js
const fmgp = require('./index-FMGP.js');

// Definir la ruta /samples/FMGP
app.get('/samples/FMGP', (req, res) => {
    // EJECUTAS la función que exporta index-FMGP.js
    const resultado = fmgp.calcularMedia();
    res.json(resultado);
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Prueba: https://sos2526-30.onrender.com/samples/FMGP`);
});