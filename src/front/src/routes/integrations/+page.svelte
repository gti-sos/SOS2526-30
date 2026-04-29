<script>
    // Lista de miembros y sus integraciones
    const miembros = [
        {
            nombre: "Gonzalo García Gómez",
            recurso: "Olympics Athlete Events",
            ruta: "/integrations/olympics-athlete-events",
            descripcion: "Datos de atletas olímpicos (altura, peso, años, medallas)"
        },
        {
            nombre: "David Real Pérez",
            recurso: "Esports Growth Stats",
            ruta: "/integrations/esportsgrowth-stats",
            descripcion: "Estadísticas de crecimiento de esports por país"
        },
        {
            nombre: "Mario Ramos Tuñón",
            recurso: "Esports Earnings Stats",
            ruta: "/integrations/esportsearnings-stats",
            descripcion: "Estadísticas de ganancias en torneos de esports"
        },
        {
            nombre: "Francisco Manuel García Patino",
            recurso: "Cheaters Stats",
            ruta: "/integrations/cheaters-stats",
            descripcion: "Estadísticas de tramposos en videojuegos"
        }
    ];
</script>

<div class="integrations-container">
    <h1>🔗 Integraciones con APIs</h1>
    <p class="subtitle">Visualizaciones y usos de APIs propias y de compañeros</p>

    <div class="integrations-grid">
        {#each miembros as miembro}
            <div class="integration-card">
                <div class="card-icon">
                    {#if miembro.recurso === "Olympics Athlete Events"}
                        🏅
                    {:else if miembro.recurso === "Esports Growth Stats"}
                        📈
                    {:else if miembro.recurso === "Esports Earnings Stats"}
                        💰
                    {:else}
                        🚫
                    {/if}
                </div>
                <h3>{miembro.recurso}</h3>
                <p class="autor">por <strong>{miembro.nombre}</strong></p>
                <p class="descripcion">{miembro.descripcion}</p>
                <a href="{miembro.ruta}" class="btn-integracion">
                    Ver integración →
                </a>
            </div>
        {/each}
    </div>

    <div class="info">
        <h3>📖 Sobre las integraciones</h3>
        <ul>
            <li>Cada integración consume una API diferente (propia o de compañeros)</li>
            <li>Se utilizan diferentes tipos de visualización (no "line")</li>
            <li>Todas las APIs siguen el estilo RESTful y devuelven JSON</li>
        </ul>
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

    .autor {
        color: #64748b;
        font-size: 0.85rem;
        margin: 0 0 0.5rem 0;
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

    .info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border: 1px solid #bae6fd;
    }

    .info h3 {
        color: #0369a1;
        margin-top: 0;
    }

    .info ul {
        margin: 0;
        padding-left: 1.5rem;
    }

    .info li {
        margin: 0.5rem 0;
        color: #333;
    }
</style>