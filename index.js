const express = require('express');
const path = require('path');

const FMPG = require("./index-FMGP.js");
const GGG = require("./index-GGG.js");
const DRP = require("./index-DRP.js");
const MRT = require("./index-MRT.js");
const cool = require("cool-ascii-faces"); 

// Importamos las APIs modulares
const athleteEventsAPI = require("./api/athlete_events.js");
const cheatersStatsAPI = require("./api/cheaters-stats.js");
const esportsgrowthAPI = require("./api/esportsgrowth-stats.js");
const esportsearningsAPI = require("./api/esportsearnings-stats.js");

const app = express();
const BASE_URL_API = "/api/v1";

app.use(express.json());
app.use(express.static("public"));

// Registramos las APIs
app.use(`${BASE_URL_API}/olympics-athlete-events`, athleteEventsAPI);
app.use(`${BASE_URL_API}/cheaters-stats`, cheatersStatsAPI);
app.use(`${BASE_URL_API}/esportsgrowth-stats`, esportsgrowthAPI);
app.use(`${BASE_URL_API}/esportsearnings-stats`, esportsearningsAPI);

app.get('/', (req, res) => {
    res.json({
        message: "SOS2526-30 running correctly",
        endpoints: {
            samples: {
                FMGP: "/samples/FMGP",
                GGG: "/samples/GGG",
                DRP: "/samples/DRP",
                MRT: "/samples/MRT",
            },
            apis: {
                cheaters: {
                    base: "/api/v1/cheaters-stats",
                    countries: "/api/v1/cheaters-stats/countries",
                    years: "/api/v1/cheaters-stats/years"
                },
                athletes: {
                    base: "/api/v1/athlete-events",
                    teams: "/api/v1/athlete-events/teams",
                    sports: "/api/v1/athlete-events/sports",
                    cities: "/api/v1/athlete-events/cities",
                    years: "/api/v1/athlete-events/years",
                    seasons: "/api/v1/athlete-events/seasons"
                },
                esports: "/api/v1/esportsgrowth-stats",
                earnings: "/api/v1/esportsearnigs-stats"
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
app.get("/samples/MRT", (req, res) => {
    try {
        const resultado = MRT.calcularMediaEsports();
        res.send(`<h1>Resultado eSports</h1>
                   <p>${resultado}</p>`);
    } catch (error) {
        res.status(500).send("Error calculando la media de eSports");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`- /samples/FMGP`);
    console.log(`- /samples/GGG`);
    console.log(`- /samples/DRP`);
    console.log(`- /samples/MRT`);
    console.log(`- /api/v1/cheaters-stats`);
    console.log(`- /api/v1/athlete-events`);
    console.log(`- /api/v1/esportsgrowth-stats`);
    console.log(`- /api/v1/esportsearnings-stats`);
    console.log("\n📋 LISTAS (GET, POST, DELETE):");
    console.log(`- /api/v1/cheaters-stats/countries`);
    console.log(`- /api/v1/cheaters-stats/years`);
    console.log(`- /api/v1/athlete-events/teams`);
    console.log(`- /api/v1/athlete-events/sports`);
    console.log(`- /api/v1/athlete-events/cities`);
    console.log(`- /api/v1/athlete-events/years`);
    console.log(`- /api/v1/athlete-events/seasons`);
    console.log("\n🔍 RECURSOS CONCRETOS (GET, PUT, DELETE):");
    console.log(`- /api/v1/cheaters-stats/countries/spain`);
    console.log(`- /api/v1/cheaters-stats/years/2020`);
    console.log(`- /api/v1/athlete-events/teams/netherlands`);
    console.log(`- /api/v1/athlete-events/sports/basketball`);
    console.log(`- /api/v1/athlete-events/cities/barcelona`);
    console.log(`- /api/v1/athlete-events/years/1992`);
    console.log(`- /api/v1/athlete-events/seasons/summer`);
    console.log(`- /api/v1/esportsgrowth-stats/United States/2017`);
    console.log("=".repeat(50));
});
