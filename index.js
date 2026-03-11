    import express from 'express';
    import path from 'path';
    import { fileURLToPath } from 'url';

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    //const MRT = require("./index-MRT.js");

    import loadBackendGGG from './src/backend/indexGGG.js';
    import loadBackendFMGP from './src/backend/cheaters-stats.js';
    // import esportsgrowthAPI from './api/esportsgrowth-stats.js';
    // import esportsearningsAPI from './api/esportsearnings-stats.js';

    const app = express();
    const BASE_URL_API = "/api/v1";

 
    app.use(express.json());
    app.use(express.static("public"));

    loadBackendGGG(app)
    loadBackendFMGP(app)



    // app.use(`${BASE_URL_API}/cheaters-stats`, cheatersStatsAPI);
    // app.use(`${BASE_URL_API}/esportsgrowth-stats`, esportsgrowthAPI);
    // app.use(`${BASE_URL_API}/esportsearnings-stats`, esportsearningsAPI);

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public/index.html'));
    });

    app.get('/about', (req, res) => {
        res.sendFile(path.join(__dirname, 'public/about.html'));
    });

    // app.get("/samples/MRT", (req, res) => {
    //     try {
    //         const resultado = MRT.calcularMediaEsports();
    //         res.send(`<h1>Resultado eSports</h1>
    //                 <p>${resultado}</p>`);
    //     } catch (error) {
    //         res.status(500).send("Error calculando la media de eSports");
    //     }
    // });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log("=".repeat(50));
        console.log(`Servidor corriendo en puerto ${PORT}`);
        console.log("=".repeat(50));
    });