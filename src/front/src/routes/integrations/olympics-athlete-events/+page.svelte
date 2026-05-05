<script>
    const integraciones = [
        {
            titulo: "Integracion 1 - Ozone Depleting Substances",
            descripcion: "Integracion con api G22-ozone-depleting-substance-consumptions",
            ruta: "/integrations/olympics-athlete-events/ozone-depleting-substance-consumptions",
        },
        {
            titulo: "Integracion 2 - Average Monthly Wages",
            descripcion: "Integracion con api G24-average-monthly-wages",
            ruta: "/integrations/olympics-athlete-events/average-monthly-wages",
        },
        {
            titulo: "Integracion 3 - Average Annual Temperatures",
            descripcion: "Integracion con api G25-average-annual-temperatures",
            ruta: "/integrations/olympics-athlete-events/average-annual-temperatures",
        },
        {
            titulo: "Integracion 4 - SpaceX",
            descripcion: "Integracion con api SpaceX",
            ruta: "/integrations/olympics-athlete-events/SpaceX",
            
        },
        {
            titulo: "Integracion 5 - GitHub API",
            descripcion: "Integracion con api GitHub",
            ruta: "/integrations/olympics-athlete-events/github",
        },
        {
            titulo: "Integracion 6 - The Cat API",
            descripcion: "Integracion con api The Cat API", 
            ruta: "/integrations/olympics-athlete-events/theCatsApi",            
        },
    ];
</script>

<div class="integrations-container">
    <h1> Integraciones - Olympics Athlete Events</h1>
    <p class="subtitle">Visualizaciones y usos de la API de atletas olímpicos (Gonzalo García Gómez)</p>

    <div class="integrations-grid">
        {#each integraciones as item}
            <div class="integration-card">
                <h3>{item.titulo}</h3>
                <p class="descripcion">{item.descripcion}</p>
                <a href="{item.ruta}" class="btn-integracion">
                    Ver integración →
                </a>
            </div>
        {/each}
    </div>
</div>

<style>
    .integrations-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        min-height: 600px;
    }

    h1 {
        color: #0369a1;
        text-align: center;
        margin-bottom: 0.5rem;
    }

    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 2rem;
    }

    .integrations-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .integration-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .integration-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        border-color: #0284c7;
    }

    .card-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .integration-card h3 {
        color: #0369a1;
        margin: 0 0 0.5rem 0;
        font-size: 1.25rem;
    }

    .descripcion {
        color: #475569;
        font-size: 0.9rem;
        margin: 0 0 1rem 0;
        line-height: 1.4;
    }

    .btn-integracion {
        display: inline-block;
        background: #0284c7;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.9rem;
        transition: background 0.2s;
    }

    .btn-integracion:hover {
        background: #0369a1;
    }
</style>