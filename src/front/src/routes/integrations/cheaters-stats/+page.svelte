<svelte:head>
    <title>Integraciones | Cheaters Stats</title>
</svelte:head>

<div class="container">
    <div class="header">
        <a href="/integrations" class="back-link">← Volver a integraciones</a>
        <h1>🔗 Integraciones de APIs</h1>
        <p class="subtitle">APIs externas y de otros alumnos integradas con gráficos ApexCharts</p>
    </div>
    
    <div class="integrations-grid">
        <a href="/integrations/cheaters-stats/agriculture" class="card">
            <div class="card-icon">🌾</div>
            <h2>Global Agriculture Climate Impacts</h2>
            <p>Celia Leal Salvago (Grupo 22)</p>
            <span class="badge">Gráfico de Barras</span>
        </a>
        
        <a href="/integrations/cheaters-stats/construction" class="card">
            <div class="card-icon">🏗️</div>
            <h2>International Construction Costs</h2>
            <p>Isaac Rodríguez Godino (Grupo 24)</p>
            <span class="badge">Gráfico de Dispersión</span>
        </a>
        
        <a href="/integrations/cheaters-stats/pokemon" class="card">
            <div class="card-icon">⚡</div>
            <h2>Pokémon API</h2>
            <p>API pública - Datos de Pokémon</p>
            <span class="badge">Gráfico de Radar</span>
        </a>
        
        <a href="/integrations/cheaters-stats/lol-esports" class="card">
            <div class="card-icon">🎮</div>
            <h2>League of Legends Esports</h2>
            <p>API externa (datos de ejemplo)</p>
            <span class="badge">Gráfico de Donut</span>
        </a>
        
        <a href="/integrations/cheaters-stats/minecraft-server" class="card">
            <div class="card-icon">⛏️</div>
            <h2>Minecraft Server Status</h2>
            <p>API externa (datos de ejemplo)</p>
            <span class="badge">Gráfico Radial</span>
        </a>
    </div>
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .header { text-align: center; margin-bottom: 2rem; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #7e22ce; margin: 0; }
    .subtitle { color: #666; }
    .integrations-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .card { background: #faf5ff; border-radius: 16px; padding: 1.5rem; text-decoration: none; text-align: center; transition: transform 0.2s; border: 1px solid #e9d5ff; }
    .card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(147,51,234,0.1); }
    .card-icon { font-size: 3rem; margin-bottom: 1rem; }
    .card h2 { color: #7e22ce; margin: 0 0 0.5rem 0; font-size: 1.2rem; }
    .card p { color: #666; margin: 0 0 1rem 0; font-size: 0.85rem; }
    .badge { display: inline-block; background: #e9d5ff; color: #7e22ce; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.7rem; font-weight: bold; }
</style>