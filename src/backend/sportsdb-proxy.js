import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const router = express.Router();

const SPORTSDB_API_KEY = process.env.SPORTSDB_API_KEY;

console.log('⚽ SportsDB API Proxy cargado');
console.log('API Key:', SPORTSDB_API_KEY);

// Endpoint de status
router.get('/status', async (req, res) => {
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/all_leagues.php`;
        const response = await fetch(url);
        const data = await response.json();
        
        res.json({
            authenticated: response.status === 200,
            status: response.status,
            api_key: SPORTSDB_API_KEY,
            leagues_found: data.leagues ? data.leagues.length : 0
        });
    } catch (error) {
        res.status(500).json({ authenticated: false, error: error.message });
    }
});

// Obtener todos los deportes (✅ SIN datos precargados)
router.get('/sports', async (req, res) => {
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/all_sports.php`;
        const response = await fetch(url);
        const data = await response.json();
        
        res.json({
            success: true,
            sports: data.sports || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener ligas por país (✅ SIN datos precargados)
router.get('/leagues', async (req, res) => {
    const { country = 'Spain' } = req.query;
    
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/search_all_leagues.php?c=${encodeURIComponent(country)}`;
        const response = await fetch(url);
        const data = await response.json();
        
        res.json({
            success: true,
            country: country,
            leagues: data.countries || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener eventos por liga (✅ SIN datos precargados)
router.get('/events', async (req, res) => {
    const { leagueId, season = '2024' } = req.query;
    
    if (!leagueId) {
        return res.status(400).json({ error: 'Se requiere leagueId' });
    }
    
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/eventsseason.php?id=${leagueId}&s=${season}`;
        console.log('🌐 Fetching events:', url);
        
        const response = await fetch(url);
        const text = await response.text();
        
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Error parsing JSON, response was HTML:', text.substring(0, 200));
            return res.json({
                success: true,
                leagueId: leagueId,
                season: season,
                events: []
            });
        }
        
        res.json({
            success: true,
            leagueId: leagueId,
            season: season,
            events: data.events || []
        });
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.json({
            success: true,
            leagueId: leagueId,
            season: season,
            events: []
        });
    }
});

// ✅ NUEVO ENDPOINT: Obtener equipos por país y deporte
router.get('/teams', async (req, res) => {
    const { sport = 'Soccer', country = 'Spain' } = req.query;
    
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/${SPORTSDB_API_KEY}/search_all_teams.php?s=${encodeURIComponent(sport)}&c=${encodeURIComponent(country)}`;
        console.log('⚽ Fetching teams:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        res.json({
            success: true,
            sport: sport,
            country: country,
            teams: data.teams || []
        });
    } catch (error) {
        console.error('Error fetching teams:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;