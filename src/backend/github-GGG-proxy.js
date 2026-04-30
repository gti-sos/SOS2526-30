import express from 'express';

const router = express.Router();

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// URL base del frontend
const FRONTEND_URL = process.env.NODE_ENV === 'production' 
    ? 'https://sos2526-30.onrender.com'
    : 'http://localhost:5173';

// 1. Iniciar login con GitHub
router.get('/login', (req, res) => {
    const redirectUri = process.env.NODE_ENV === 'production'
        ? 'https://sos2526-30.onrender.com/api/github/callback'
        : 'http://localhost:3000/api/github/callback';
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user repo`;
    
    res.redirect(authUrl);
});

// 2. Callback de GitHub (intercambia código por token)
router.get('/callback', async (req, res) => {
    const { code } = req.query;
    const redirectUri = process.env.NODE_ENV === 'production'
        ? 'https://sos2526-30.onrender.com/api/github/callback'
        : 'http://localhost:3000/api/github/callback';
    
    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                redirect_uri: redirectUri
            })
        });
        
        const data = await response.json();
        const accessToken = data.access_token;
        
        // Redirigir al frontend con el token
        res.redirect(`${FRONTEND_URL}/integrations/github-callback?token=${accessToken}`);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Proxy para peticiones autenticadas
router.use('/api', async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const url = 'https://api.github.com' + req.url;
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'SOS2526-30-App',
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;