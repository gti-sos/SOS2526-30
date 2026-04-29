export async function GET({ url }) {
    const targetUrl = url.searchParams.get('url');
    
    if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'URL parameter required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        const response = await fetch(targetUrl);
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