<script>
    import { onMount } from 'svelte';
    
    let data = [];
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
                body: JSON.stringify({ endpoint: 'pokemon', method: 'GET' })
            });
            const responseData = await res.json();
            data = Array.isArray(responseData) ? responseData.slice(0, 20) : [];
            loading = false;
        } catch (err) {
            error = err.message;
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Pokémon API | Integraciones</title>
</svelte:head>

<div class="integration-page">
    <div class="header">
        <a href="/integrations" class="back-link">← Volver a integraciones</a>
        <h1>⚡ Pokémon API</h1>
        <p class="subtitle">API externa vía RapidAPI</p>
        <div class="badges">
            <span class="badge external">🌍 Externa</span>
            <span class="badge rapid">RapidAPI</span>
        </div>
    </div>
    
    <div class="content">
        {#if loading}
            <div class="loading">Cargando Pokémons...</div>
        {:else if error}
            <div class="error">❌ Error: {error}</div>
        {:else}
            <div class="stats-summary">
                <div class="stat-card">
                    <span class="stat-value">{data.length}</span>
                    <span class="stat-label">Pokémons</span>
                </div>
            </div>
            
            <div class="pokemon-grid">
                {#each data as pokemon}
                    <div class="pokemon-card">
                        <div class="pokemon-number">#{pokemon.id || pokemon.number || '?'}</div>
                        <strong>{pokemon.name}</strong>
                        <small>Tipo: {pokemon.type || (pokemon.types ? pokemon.types.join(', ') : 'Desconocido')}</small>
                    </div>
                {/each}
            </div>
            
            <div class="api-info">
                <p><strong>🔗 Endpoint:</strong> <code>https://pokemon-api3.p.rapidapi.com/pokemon</code></p>
                <p><strong>📡 Método:</strong> GET</p>
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
    
    .stats-summary {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 2rem;
    }
    
    .stat-card {
        background: #faf5ff;
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
        min-width: 120px;
    }
    
    .stat-value {
        display: block;
        font-size: 2rem;
        font-weight: bold;
        color: #7e22ce;
    }
    
    .stat-label {
        font-size: 0.8rem;
        color: #666;
    }
    
    .pokemon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    
    .pokemon-card {
        background: #faf5ff;
        border-radius: 12px;
        padding: 1rem;
        text-align: center;
        border: 1px solid #e9d5ff;
        transition: transform 0.2s;
    }
    
    .pokemon-card:hover {
        transform: translateY(-3px);
    }
    
    .pokemon-number {
        font-size: 0.7rem;
        color: #7e22ce;
        margin-bottom: 0.3rem;
    }
    
    .pokemon-card strong {
        display: block;
        font-size: 1rem;
        margin-bottom: 0.3rem;
    }
    
    .pokemon-card small {
        font-size: 0.7rem;
        color: #666;
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
        
        .pokemon-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        }
    }
</style>