const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// Importamos tu función desde la raíz
const fmgp = require('./index-FMGP.js');

app.get('/samples/FMGP', (req, res) => {
    try {
        // Ejecutamos tu función
        const resultado = fmgp.calcularMediaCheaters();
        
        // Creamos el mismo mensaje que en index-FMGP.js
        const mensaje = `Media de ${resultado.CampoNumerico} en ${resultado.FiltroPais}: ${resultado.media.toFixed(2)}`;
        
        // Enviamos como texto plano (no JSON)
        res.set('Content-Type', 'text/plain');
        res.send(mensaje);
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error interno del servidor");
    }
});

// Ruta raíz (opcional)
app.get('/', (req, res) => {
    res.send('API funcionando. Prueba /samples/FMGP');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Prueba: /samples/FMGP`);
});