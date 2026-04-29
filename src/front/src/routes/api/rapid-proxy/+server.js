import { RAPIDAPI_KEY } from '$env/static/private';

export async function POST({ request }) {
    try {
        const { endpoint, params, method = 'GET' } = await request.json();
        
        let url = '';
        let options = {
            method: method,
            headers: {
                'x-rapidapi-key': RAPIDAPI_KEY,
                'x-rapidapi-host': ''
            }
        };
        
        if (endpoint === 'pokemon') {
            url = 'https://pokemon-api3.p.rapidapi.com/pokemon';
            options.headers['x-rapidapi-host'] = 'pokemon-api3.p.rapidapi.com';
        } 
        else if (endpoint === 'lol-esports') {
            url = `https://league-of-legends-esports1.p.rapidapi.com/team-statistics?tournamentId=${params.tournamentId || '1177'}`;
            options.headers['x-rapidapi-host'] = 'league-of-legends-esports1.p.rapidapi.com';
        }
        else if (endpoint === 'minecraft') {
            url = 'https://minecraftstefan-skliarovv1.p.rapidapi.com/getPCServerMOTD';
            options.method = 'POST';
            options.headers['x-rapidapi-host'] = 'Minecraftstefan-skliarovV1.p.rapidapi.com';
            options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
            options.body = new URLSearchParams({ address: params.address || 'mc.hypixel.net' });
        }
        
        const response = await fetch(url, options);
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}