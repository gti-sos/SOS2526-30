<script>
    const integraciones = [
        {
            titulo: "Integración 1 - TVMaze (Series)",
            descripcion: "Jugadores de eSports vs Puntuaciones de Series (API Externa)",
            ruta: "/integrations/esportsearnings-stats/tvmaze",
            icono: "📺"
        },
        {
            titulo: "Integración 2 - FakeStore (Tienda)",
            descripcion: "Premios de eSports vs Precio de productos (API Externa)",
            ruta: "/integrations/esportsearnings-stats/fakestore",
            icono: "🛒"
        },
        {
            titulo: "Integración 3 - Rick & Morty",
            descripcion: "Géneros de eSports vs Especies de personajes (API Externa)",
            ruta: "/integrations/esportsearnings-stats/rick-and-morty",
            icono: "👽"
        },
        {
            titulo: "Integración 4 - Citys Stats (G29)",
            descripcion: "Cruce con Grupo 29 mediante PROXY propio",
            ruta: "/integrations/esportsearnings-stats/citys-stats",
            icono: "🏙️"
        },
        {
            titulo: "Integración 5 - Presas de Agua (G27)",
            descripcion: "Jugadores de eSports vs Presas de Agua (ApexCharts - Radar)",
            ruta: "/integrations/esportsearnings-stats/water-dams",
            icono: "💧"
        },
        {
            titulo: "Integración 6 - Pandemias (G10)",
            descripcion: "Jugadores eSports vs Víctimas (ApexCharts - Barras Horizontales)",
            ruta: "/integrations/esportsearnings-stats/pandemics",
            icono: "🦠"
        }
    ];
</script>

<!-- Aquí está el HTML que faltaba para que la página no salga en blanco -->
<div class="container">
    <a href="/" class="back-link">← Volver al inicio</a>
    
    <div class="header">
        <h1>🎮 Integraciones - eSports Earnings</h1>
        <p>Visualizaciones y cruce de datos</p>
    </div>

    <div class="grid">
        <!-- Esto recorre la lista de arriba y dibuja una tarjeta por cada una -->
        {#each integraciones as int}
            <div class="card">
                <div class="icon">{int.icono}</div>
                <h2>{int.titulo}</h2>
                <p>{int.descripcion}</p>
                <a href={int.ruta} class="btn">Ver integración →</a>
            </div>
        {/each}
    </div>
</div>

<!-- Y aquí los estilos para que se vea profesional -->
<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        font-family: system-ui, -apple-system, sans-serif;
    }
    .back-link {
        color: #7e22ce;
        text-decoration: none;
        font-weight: bold;
        display: inline-block;
        margin-bottom: 2rem;
    }
    .back-link:hover {
        text-decoration: underline;
    }
    .header {
        text-align: center;
        margin-bottom: 3rem;
    }
    .header h1 {
        color: #7e22ce;
        margin-bottom: 0.5rem;
        font-size: 2.5rem;
    }
    .header p {
        color: #6b7280;
        font-size: 1.1rem;
    }
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 2rem;
    }
    .card {
        background: white;
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        border: 1px solid #f3e8ff;
        transition: transform 0.2s, box-shadow 0.2s;
        display: flex;
        flex-direction: column;
        height: 100%;
    }
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        border-color: #d8b4fe;
    }
    .icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    .card h2 {
        color: #4c1d95;
        font-size: 1.25rem;
        margin-bottom: 1rem;
    }
    .card p {
        color: #4b5563;
        margin-bottom: 2rem;
        flex-grow: 1;
    }
    .btn {
        display: inline-block;
        background-color: #9333ea;
        color: white;
        text-decoration: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: bold;
        transition: background-color 0.2s;
    }
    .btn:hover {
        background-color: #7e22ce;
    }
</style>
