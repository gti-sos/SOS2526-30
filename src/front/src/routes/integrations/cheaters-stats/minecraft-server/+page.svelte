<script>
    import { onMount } from 'svelte';
    
    let data = {};
    let loading = true;
    let error = null;
    
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
            data = responseData || {};
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
            <span class="badge external">🌍 Externa</span>
            <span class="badge rapid">RapidAPI</span>
        </div>
    </div>
    
    <div class="content">
        {#if loading}
            <div class="loading">Consultando servidor...</div>
        {:else if error}
            <div class="error">❌ Error: {error}</div>
        {:else}
            <div class="server-info">
                <div class="server-card">
                    <div class="server-icon">⛏️</div>
                    <h2>{data.server_address || data.ip || 'mc.hypixel.net'}</h2>
                    
                    <div class="server-details">
                        <div class="detail-item">
                            <span class="detail-label">Jugadores online:</span>
                            <span class="detail-value">{data.players_online || data.online || 0} / {data.players_max || data.max || 0}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">MOTD:</span>
                            <span class="detail-value">{data.motd || data.description || 'Minecraft Server'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Versión:</span>
                            <span class="detail-value">{data.version || data.game_version || '1.8+'}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="api-info">
                <p><strong>🔗 Endpoint:</strong> <code>https://minecraftstefan-skliarovv1.p.rapidapi.com/getPCServerMOTD</code></p>
                <p><strong>📡 Método:</strong> POST</p>
                <p><strong>📦 Formato:</strong> JSON</p>
                <p><strong>🔑 Autenticación:</strong> RapidAPI Key (vía proxy)</p>
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
    
    .server-info {
        display: flex;
        justify-content: center;
        margin-bottom: 2rem;
    }
    
    .server-card {
        background: linear-gradient(135deg, #faf5ff, #e9d5ff);
        border-radius: 20px;
        padding: 2rem;
        text-align: center;
        min-width: 300px;
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
    }
    
    .server-details {
        text-align: left;
    }
    
    .detail-item {
        margin: 1rem 0;
        padding: 0.5rem;
        background: white;
        border-radius: 8px;
    }
    
    .detail-label {
        font-weight: bold;
        color: #7e22ce;
        display: block;
        margin-bottom: 0.3rem;
    }
    
    .detail-value {
        color: #333;
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
    }
    
    @media (max-width: 768px) {
        .integration-page {
            padding: 1rem;
        }
        
        .server-card {
            min-width: auto;
            padding: 1rem;
        }
    }
</style>