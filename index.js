    import express from 'express';
    import cors from 'cors';
    import { handler } from './src/front/build/handler.js';
    import path from 'path';
    import { fileURLToPath } from 'url';
    import util from 'util';
    import{handler} from './src/frontend/build/handler.js';  
    util.isDate = function(d) { return d instanceof Date; };

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const app = express();
    import loadBackendGGG from './src/backend/olympics-athlete-events.js';
    import loadBackendFMGP from './src/backend/cheaters-stats.js';
    import esportsgrowthAPI from './src/backend/esportsgrowth-stats.js';
    import esportsearningsAPI from './src/backend/esportsearnings-stats.js';

    app.use(cors());
    const BASE_URL_API = "/api/v1";

 
    app.use(express.json());

    loadBackendGGG(app)
    loadBackendFMGP(app)

    app.use(`${BASE_URL_API}/esportsgrowth-stats`, esportsgrowthAPI);
    app.use(`${BASE_URL_API}/esportsearnings-stats`, esportsearningsAPI);
    
    app.use(express.json());
    app.use(cors());    
    loadBackendGGG(app)
    loadBackendFMGP(app)
    

    app.use(handler);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log("=".repeat(50));
        console.log(`Servidor corriendo en puerto ${PORT}`);
        console.log("=".repeat(50));
        
    });
