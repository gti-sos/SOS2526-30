import { VITE_GITHUB_TOKEN } from '$env/static/private';

// Tokens válidos para autenticación del cliente
const VALID_CLIENT_TOKENS = [
    'mi-token-secreto-para-demo',
    'sos2526-2024-token-seguro'
];

export async function GET({ request, url }) {
    // 1. VERIFICAR AUTENTICACIÓN DEL CLIENTE
    const authHeader = request.headers.get('authorization');
    const clientToken = authHeader?.split(' ')[1];
    
    if (!clientToken) {
        return new Response(JSON.stringify({ 
            error: 'No autorizado. Se requiere token de autenticación.',
            authenticated: false,
            code: 'MISSING_TOKEN'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    if (!VALID_CLIENT_TOKENS.includes(clientToken)) {
        return new Response(JSON.stringify({ 
            error: 'Token inválido o expirado',
            authenticated: false,
            code: 'INVALID_TOKEN'
        }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    // 2. OBTENER PARÁMETROS
    const repoPath = url.searchParams.get('path');
    
    if (!repoPath) {
        return new Response(JSON.stringify({ 
            error: 'Se requiere parámetro path',
            code: 'MISSING_PATH'
        }), { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
        });
    }
    
    try {
        // 3. LLAMAR A GITHUB API (con autenticación si hay token)
        const rawUrl = `https://raw.githubusercontent.com/${repoPath}`;
        
        const fetchOptions = {};
        if (VITE_GITHUB_TOKEN) {
            fetchOptions.headers = {
                'Authorization': `Bearer ${VITE_GITHUB_TOKEN}`,
                'User-Agent': 'SOS2526-30-App'
            };
        }
        
        const response = await fetch(rawUrl, fetchOptions);
        
        if (!response.ok) {
            return new Response(JSON.stringify({ 
                error: `GitHub API error: ${response.status}`,
                authenticated: true,
                code: 'GITHUB_ERROR'
            }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        
        const data = await response.text();
        
        // Validar que es JSON válido
        try {
            JSON.parse(data);
        } catch (e) {
            return new Response(JSON.stringify({ 
                error: 'La respuesta no es JSON válido',
                authenticated: true,
                code: 'INVALID_JSON'
            }), { status: 500 });
        }
        
        // 4. DEVOLVER DATOS CON INDICADOR DE AUTENTICACIÓN
        return new Response(data, {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'X-Authenticated': 'true',
                'X-Token-Validated': 'true'
            }
        });
        
    } catch (error) {
        return new Response(JSON.stringify({ 
            error: error.message,
            authenticated: true,
            code: 'PROXY_ERROR'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}