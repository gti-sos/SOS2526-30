const fmgp = require('./index-FMGP.js'); 


const initialData = fmgp.datos;  


let cheatersStats = [];



const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;


const fmgp = require('./index-FMGP.js');

app.get('/samples/FMGP', (req, res) => {
    try {
       
        const resultado = fmgp.calcularMediaCheaters();
        
        
        const mensaje = `Media de ${resultado.CampoNumerico} en ${resultado.FiltroPais}: ${resultado.media.toFixed(2)}`;
        
        
        res.set('Content-Type', 'text/plain');
        res.send(mensaje);
        
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error interno del servidor");
    }
});


app.get('/', (req, res) => {
    res.send('API funcionando. Prueba /samples/FMGP');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`Prueba: /samples/FMGP`);
});