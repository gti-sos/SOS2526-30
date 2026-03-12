    import express from 'express';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import util from 'util';
    util.isDate = function(d) { return d instanceof Date; };

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);


    import loadBackendGGG from './src/backend/indexGGG.js';
    import loadBackendFMGP from './src/backend/cheaters-stats.js';
    import esportsgrowthAPI from './api/esportsgrowth-stats.js';
    import esportsearningsAPI from './api/esportsearnings-stats.js';

    const app = express();
    const BASE_URL_API = "/api/v1";

 
    app.use(express.json());
    app.use(express.static("public"));

    loadBackendGGG(app)
    loadBackendFMGP(app)

    app.use(`${BASE_URL_API}/esportsgrowth-stats`, esportsgrowthAPI);
    app.use(`${BASE_URL_API}/esportsearnings-stats`, esportsearningsAPI);

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public/index.html'));
    });

    app.get('/about', (req, res) => {
        res.sendFile(path.join(__dirname, 'public/about.html'));
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log("=".repeat(50));
        console.log(`Servidor corriendo en puerto ${PORT}`);
        console.log("=".repeat(50));
        
    });
