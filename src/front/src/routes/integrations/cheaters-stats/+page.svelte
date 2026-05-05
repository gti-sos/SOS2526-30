<svelte:head>
    <title>Integraciones | Cheaters Stats</title>
</svelte:head>

<div class="container">
    <div class="header">
        <a href="/integrations" class="back-link">← Volver a integraciones</a>
        <h1>🔗 Integraciones de APIs</h1>
        <p class="subtitle">APIs externas y de otros alumnos integradas con gráficos Chart.js</p>
    </div>
    
    <div class="integrations-grid">
        <a href="/integrations/cheaters-stats/agriculture" class="card">
            <div class="card-icon">🌾</div>
            <h2>Global Agriculture Climate Impacts</h2>
            <p>Celia Leal Salvago (Grupo 22)</p>
            <span class="badge">Gráfico de Radar</span>
        </a>
        
        <a href="/integrations/cheaters-stats/construction" class="card">
            <div class="card-icon">🏗️</div>
            <h2>International Construction Costs</h2>
            <p>Isaac Rodríguez Godino (Grupo 24)</p>
            <span class="badge">Gráfico de Radar</span>
        </a>
        
        <a href="/integrations/cheaters-stats/active-satellites" class="card">
            <div class="card-icon">🛰️</div>
            <h2>Active Satellites</h2>
            <p>Jaime García Algarra (Grupo 14)</p>
            <span class="badge">Gráfico de Radar</span>
        </a>
        
        <a href="/integrations/cheaters-stats/deaths-by-risk-factors" class="card">
            <div class="card-icon">💀</div>
            <h2>Deaths by Risk Factors</h2>
            <p>API estable v2</p>
            <span class="badge">Gráfico de Radar</span>
        </a>
        
        <a href="/integrations/cheaters-stats/international-tourist-arrival" class="card">
            <div class="card-icon">✈️</div>
            <h2>International Tourist Arrivals</h2>
            <p>Aimar García Borrego (Grupo 25)</p>
            <span class="badge">Gráfico de Radar</span>
        </a>
        
        <a href="/integrations/cheaters-stats/weather" class="card">
            <div class="card-icon">⚡</div>
            <h2>Weather API</h2>
            <p>API pública - Datos meteorológicos</p>
            <span class="badge">Gráfico de Radar</span>
        </a>
        
        <a href="/integrations/cheaters-stats/dog" class="card">
            <div class="card-icon">🎵</div>
            <h2>Spotify API</h2>
            <p>API pública - Datos de Spotify</p>
            <span class="badge">Gráfico de Barras</span>
        </a>
        
        <a href="/integrations/cheaters-stats/sports" class="card">
            <div class="card-icon">🎮</div>
            <h2>SportsDB API</h2>
            <p>API pública - Datos de deportes</p>
            <span class="badge">Gráfico Radial</span>
        </a>
    </div>
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .header { text-align: center; margin-bottom: 2rem; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #7e22ce; margin: 0; }
    .subtitle { color: #666; }
    .integrations-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .card { background: #faf5ff; border-radius: 16px; padding: 1.5rem; text-decoration: none; text-align: center; transition: transform 0.2s; border: 1px solid #e9d5ff; display: block; }
    .card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(147,51,234,0.1); }
    .card-icon { font-size: 3rem; margin-bottom: 1rem; }
    .card h2 { color: #7e22ce; margin: 0 0 0.5rem 0; font-size: 1.2rem; }
    .card p { color: #666; margin: 0 0 1rem 0; font-size: 0.85rem; }
    .badge { display: inline-block; background: #e9d5ff; color: #7e22ce; padding: 0.2rem 0.8rem; border-radius: 20px; font-size: 0.7rem; font-weight: bold; }
</style>