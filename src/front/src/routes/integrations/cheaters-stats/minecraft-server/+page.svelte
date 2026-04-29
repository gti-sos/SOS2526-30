<script>
    import { onMount } from 'svelte';
    
    let loading = true;
    let error = null;
    let serverAddress = 'Cargando...';
    let playersOnline = 0;
    let playersMax = 0;
    let motd = 'Cargando...';
    let version = 'Cargando...';
    
    onMount(async () => {
        await loadData();
    });
    
    async function loadData() {
        try {
            const res = await fetch('/api/rapid-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    endpoint: 'minecraft', 
                    params: { address: 'mc.hypixel.net' }
                })
            });
            const responseData = await res.json();
            
            if (responseData) {
                serverAddress = responseData.server_address || responseData.ip || 'mc.hypixel.net';
                playersOnline = responseData.players_online || responseData.online || 0;
                playersMax = responseData.players_max || responseData.max || 0;
                motd = responseData.motd || responseData.description || 'Minecraft Server';
                version = responseData.version || responseData.game_version || '1.8+';
            }
            
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Minecraft Server | Integraciones</title>
</svelte:head>

<div class="integration-page">
    <div class="header">
        <a href="/integrations" class="back-link">← Volver a integraciones</a>
        <h1>⛏️ Minecraft Server Status</h1>
        <p class="subtitle">API externa vía RapidAPI</p>
        <div class="badges">
            <span class="badge external">Externa</span>
            <span class="badge rapid">RapidAPI</span>
        </div>
    </div>
    
    <div class="content">
        {#if loading}
            <div class="loading">Consultando servidor...</div>
        {:else if error}
            <div class="error">Error: {error}</div>
        {:else}
            <div class="server-card">
                <div class="server-icon">⛏️</div>
                <h2>{serverAddress}</h2>
                <div class="detail-item">
                    <strong>Jugadores online:</strong> {playersOnline} / {playersMax}
                </div>
                <div class="detail-item">
                    <strong>MOTD:</strong> {motd}
                </div>
                <div class="detail-item">
                    <strong>Versión:</strong> {version}
                </div>
            </div>
            
            <div class="api-info">
                <p><strong>Endpoint:</strong> <code>https://minecraftstefan-skliarovv1.p.rapidapi.com/getPCServerMOTD</code></p>
                <p><strong>Método:</strong> POST</p>
                <p><strong>Formato:</strong> JSON</p>
                <p><strong>Autenticación:</strong> RapidAPI Key (vía proxy)</p>
            </div>
        {/if}
    </div>
</div>

<style>
    .integration-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(147, 51, 234, 0.2);
        border: 1px solid #e9d5ff;
    }
    
    .header {
        text-align: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e9d5ff;
    }
    
    .back-link {
        display: inline-block;
        margin-bottom: 1rem;
        color: #7e22ce;
        text-decoration: none;
        font-size: 0.9rem;
    }
    
    .back-link:hover {
        text-decoration: underline;
    }
    
    h1 {
        color: #7e22ce;
        margin: 0 0 0.5rem 0;
    }
    
    .subtitle {
        color: #666;
        margin: 0 0 1rem 0;
    }
    
    .badges {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }
    
    .badge {
        display: inline-block;
        padding: 0.2rem 0.8rem;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: bold;
    }
    
    .badge.external {
        background: #6b7280;
        color: white;
    }
    
    .badge.rapid {
        background: #f59e0b;
        color: white;
    }
    
    .loading, .error {
        text-align: center;
        padding: 2rem;
    }
    
    .loading {
        color: #7e22ce;
    }
    
    .error {
        color: #dc2626;
    }
    
    .server-card {
        background: linear-gradient(135deg, #faf5ff, #e9d5ff);
        border-radius: 20px;
        padding: 2rem;
        text-align: center;
        margin-bottom: 2rem;
        border: 1px solid #e9d5ff;
    }
    
    .server-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }
    
    .server-card h2 {
        color: #7e22ce;
        margin: 0 0 1.5rem 0;
        font-size: 1.3rem;
        word-break: break-word;
    }
    
    .detail-item {
        margin: 0.8rem 0;
        padding: 0.5rem;
        background: white;
        border-radius: 8px;
        text-align: left;
    }
    
    .api-info {
        background: #faf5ff;
        padding: 1rem;
        border-radius: 8px;
        font-size: 0.85rem;
    }
    
    .api-info code {
        background: white;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        word-break: break-word;
    }
    
    @media (max-width: 768px) {
        .integration-page {
            padding: 1rem;
        }
        
        .server-card {
            padding: 1rem;
        }
    }
</style>