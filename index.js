const express = require('express');
const path = require('path');

const FMPG = require("./index-FMGP.js");
const GGG = require("./index-GGG.js");
const DRP = require("./samples/DRP.js")
const cool = require("cool-ascii-faces"); 

// Importamos las APIs modulares

const athleteEventsAPI = require("./api/athlete_events.js");

const app = express();
const BASE_URL_API = "/api/v1";

app.use(express.json());
app.use(express.static("public"));

// Registramos las APIs

app.use(`${BASE_URL_API}/athlete-events`, athleteEventsAPI);

app.get('/', (req, res) => {
    res.json({
        message: "SOS2526-30 running correctly",
        endpoints: {
            samples: {
                FMGP: "/samples/FMGP",
                GGG: "/samples/GGG",
                DRP: "/samples/DRP"
            },
            apis: {
                cheaters: "/api/v1/cheaters-stats",
                athletes: "/api/v1/athlete-events"
            },
            about: "/about",
            cool: "/cool"
        }
    });
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/about.html'));
});

app.get('/cool', (req, res) => {
    res.send(`<html><body><h1>${cool()}</h1></body></html>`);
});

app.get("/samples/FMGP", (req, res) => {
    try {
        const resultado = FMPG.calcularMediaCheaters();
        res.send(`<h1>Resultado para ${resultado.FiltroPais}</h1>
                  <p>Media de ${resultado.CampoNumerico}: ${resultado.media.toFixed(2)}</p>`);
    } catch (error) {
        res.status(500).send("Error calculando la media de cheaters");
    }
});

app.get("/samples/GGG", (req, res) => {
    try {
        const resultado = GGG.calcularMediaEdadAtletas();
        res.send(`<h1>Resultado para ${resultado.pais}</h1>
                  <p>Media de edad: ${resultado.media.toFixed(2)} años</p>`);
    } catch (error) {
        res.status(500).send("Error calculando la media de edad");
    }
});

app.get('/samples/DRP', (req, res) => {
    try {
        const resultado = DRP.calcularMediaViewership(); 
        
        res.send(`<h1>Resultado para Viewership</h1>
                  <p>${resultado}</p>`); 
    } catch (error) {
        res.status(500).send("Error calculando la media de viewership");
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log(`- Servidor corriendo en puerto ${PORT}`);
    console.log(`- /samples/FMGP`);
    console.log(`- /samples/GGG`);
    console.log(`- /api/v1/cheaters-stats`);
    console.log(`- /api/v1/athlete-events`);
    console.log(`- /about`);
    console.log(`- /cool`);
    console.log("=".repeat(50));
});