<script>
    const integraciones = [
        {
            titulo: "Integración 1 - RestCountries",
            descripcion: "Cruce de ganancias en eSports con población mundial (API Externa)",
            ruta: "/integrations/esportsearnings-stats/population",
            icono: "🌍"
        },
       {
            titulo: "Integración 2 - CoinCap",
            descripcion: "Premios eSports vs Precio Criptomonedas (API Externa)",
            ruta: "/integrations/esportsearnings-stats/coincap",
            icono: "💰"
        },
      {
            titulo: "Integración 3 - Rick & Morty",
            descripcion: "Géneros de eSports vs Especies de personajes (API Externa)",
            ruta: "/integrations/esportsearnings-stats/rick-and-morty",
            icono: "👽"
        },
        {
            titulo: "Integración 4 - (Próximamente)",
            descripcion: "API SOS Grupo X",
            ruta: "#",
            icono: "📊"
        },
        {
            titulo: "Integración 5 - (Próximamente)",
            descripcion: "API SOS Grupo Y (Proxy)",
            ruta: "#",
            icono: "🔒"
        }
    ];
</script>

<div class="integrations-container">
    <a href="/integrations" class="back-link">← Volver al menú general</a>
    <h1>🎮 Integraciones - eSports Earnings</h1>
    <p class="subtitle">Visualizaciones y cruce de datos (Mario)</p>

    <div class="integrations-grid">
        {#each integraciones as item}
            <div class="integration-card">
                <div class="card-icon">{item.icono}</div>
                <h3>{item.titulo}</h3>
                <p class="descripcion">{item.descripcion}</p>
                <a href="{item.ruta}" class="btn-integracion">Ver integración →</a>
            </div>
        {/each}
    </div>
</div>

<style>
    .integrations-container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; font-weight: bold; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    .integrations-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
    .integration-card { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 1.5rem; text-align: center; transition: 0.2s; }
    .integration-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(147,51,234,0.1); border-color: #a855f7; }
    .card-icon { font-size: 3rem; margin-bottom: 1rem; }
    .integration-card h3 { color: #7e22ce; margin: 0 0 0.5rem 0; font-size: 1.25rem; }
    .descripcion { color: #666; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .btn-integracion { display: inline-block; background: #a855f7; color: white; padding: 0.6rem 1.2rem; border-radius: 6px; text-decoration: none; font-weight: bold; transition: 0.2s; }
    .btn-integracion:hover { background: #9333ea; }
</style>
