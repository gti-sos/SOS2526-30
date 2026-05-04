    import dotenv from 'dotenv';
    import path from 'path';
    import { fileURLToPath } from 'url';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    dotenv.config({ path: path.resolve(__dirname, '.env') });
    console.log('Token desde .env:', process.env.XITHUB_TOKEN);
    import express from 'express';
    import cors from 'cors';
    import { handler } from './src/front/build/handler.js';
    import util from 'util';
    util.isDate = function(d) { return d instanceof Date; };
    import githubGGGProxy from './src/backend/github-GGG-proxy.js'; 
    import loadCheatersStatsGithubOAuth from './src/backend/cheaters-stats-github-oauth.js';




import loadBackendGGG from './src/backend/olympics-athlete-events.js';
import loadBackendFMGP from './src/backend/cheaters-stats.js';
import esportsgrowthAPI from './src/backend/esportsgrowth-stats.js';
import esportsearningsAPIv1 from './src/backend/esportsearnings-stats-v1.js';
import esportsearningsAPIv2 from './src/backend/esportsearnings-stats-v2.js';

const app = express();
app.use(cors());
const BASE_URL_API = "/api/v1";
const BASE_URL_API2 = "/api/v2";

app.use(express.json());

app.use('/api/github', githubGGGProxy);
loadCheatersStatsGithubOAuth(app);

loadBackendGGG(app);
loadBackendFMGP(app);


app.use(`${BASE_URL_API}/esportsgrowth-stats`, esportsgrowthAPI);
app.use(`${BASE_URL_API}/esportsearnings-stats`, esportsearningsAPIv1);
app.use(`${BASE_URL_API2}/esportsearnings-stats`, esportsearningsAPIv2);

app.use(handler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log("=".repeat(50));
});