    import express from 'express';
    import cors from 'cors';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import util from 'util';
    import{handler} from './src/frontend/build/handler.js';  
    util.isDate = function(d) { return d instanceof Date; };

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);


    import loadBackendGGG from './src/backend/olympics-athlete-events.js';
    import loadBackendFMGP from './src/backend/cheaters-stats.js';
    import esportsgrowthAPI from './src/backend/esportsgrowth-stats.js';
    import esportsearningsAPI from './src/backend/esportsearnings-stats.js';

    const app = express();
    const BASE_URL_API = "/api/v1";
    app.use(cors());    

 
    app.use(express.json());
 

    loadBackendGGG(app)
    loadBackendFMGP(app)
    app.use(handler);

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
