const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// Ruta de prueba SUPER simple
app.get('/samples/FMGP', (req, res) => {
    res.json({ mensaje: "Si ves esto, Express funciona" });
});

app.get('/', (req, res) => {
    res.json({ message: 'API funcionando' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});