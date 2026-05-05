<svelte:head>
    <title>Mis Integraciones - eSports Growth</title>
</svelte:head>

<div class="menu-container">
    <div class="header">
        <h1>🔌 Panel de Integraciones</h1>
        <p class="subtitle">Navega por las 5 APIs integradas de forma independiente</p>
        <div class="nav-links">
            <a href="/analytics/esportsgrowth-stats" class="link-btn-back">Volver a mis Analíticas</a>
        </div>
    </div>

    <div class="buttons-grid">
        <!-- BOTÓN 1: API SOS 27 (Treemap) -->
        <a href="/integrations/esportsgrowth-stats/world-hydroelectric-plants" class="integration-card sos-card">
            <h3>🎓 API Grupo 27 (SOS)</h3>
            <p>Plantas Hidroeléctricas Mundiales</p>
            <span class="badge">ApexCharts | Treemap</span>
        </a>
        
        <!-- BOTÓN 2: API SOS 24 (Funnel) -->
        <a href="/integrations/esportsgrowth-stats/recreation-culture-expenditure" class="integration-card sos-card">
            <h3>🎭 API Grupo 24 (SOS)</h3>
            <p>Gasto en Cultura y Recreación</p>
            <span class="badge">ECharts | Funnel</span>
        </a>

        <!-- HUECOS PARA LAS 3 EXTERNAS (Que haremos luego) -->
        <div class="integration-card ext-card placeholder">
            <h3>🌍 API Externa 1 (Con Proxy)</h3>
            <p>Pendiente...</p>
        </div>
        <div class="integration-card ext-card placeholder">
            <h3>🌤️ API Externa 2</h3>
            <p>Pendiente...</p>
        </div>
        <div class="integration-card ext-card placeholder">
            <h3>🚀 API Externa 3</h3>
            <p>Pendiente...</p>
        </div>
    </div>
</div>

<style>
    .menu-container { max-width: 900px; margin: 0 auto; padding: 3rem 2rem; font-family: sans-serif; }
    .header { text-align: center; margin-bottom: 3rem; }
    h1 { color: #7e22ce; margin-bottom: 0.5rem; font-size: 2.5rem;}
    .subtitle { color: #64748b; font-size: 1.1rem; }
    .nav-links { margin-top: 1.5rem; }
    .link-btn-back { display: inline-block; background: #f8fafc; color: #475569; padding: 0.6rem 1.2rem; border-radius: 8px; text-decoration: none; font-weight: bold; border: 1px solid #cbd5e1; transition: 0.2s; }
    .link-btn-back:hover { background: #e2e8f0; }

    .buttons-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }

    .integration-card { display: block; padding: 2rem; border-radius: 16px; text-decoration: none; text-align: center; transition: transform 0.2s, box-shadow 0.2s; border: 2px solid transparent; }
    a.integration-card:hover { transform: translateY(-5px); }
    
    .integration-card h3 { margin-top: 0; margin-bottom: 0.5rem; font-size: 1.3rem; }
    .integration-card p { font-size: 0.95rem; margin-bottom: 1.5rem; }
    
    .sos-card { background: #faf5ff; border-color: #e9d5ff; color: #581c87; }
    a.sos-card:hover { box-shadow: 0 10px 20px -5px rgba(126, 34, 206, 0.2); border-color: #a855f7; }
    .sos-card p { color: #7e22ce; }

    .ext-card { background: #f8fafc; border-color: #e2e8f0; color: #334155; }
    .ext-card.placeholder { opacity: 0.6; cursor: not-allowed; }
    .badge { display: inline-block; padding: 0.3rem 0.8rem; border-radius: 999px; font-size: 0.8rem; font-weight: bold; background: white; color: #7e22ce; border: 1px solid #d8b4fe; }
</style>