<script>
// @ts-nocheck
    // Información del equipo (se mantiene igual)
    const team = [
        { name: "David Real Pérez", dataSource: "esportsgrowth-stats", github: "https://github.com/davreaper" },
        { name: "Mario Ramos Tuñón", dataSource: "esportsearnings-stats", github: "https://github.com/MarioRt8558" },
        { name: "Gonzalo García Gómez", dataSource: "olympics-athlete-events", github: "https://github.com/gonzaloogrcia" },
        { name: "Francisco Manuel García Patino", dataSource: "cheaters-stats", github: "https://github.com/PaGarPa" }
    ];

    const repoUrl = "https://github.com/gti-sos/SOS2526-30";
    const baseApiUrl = "https://sos2526-30.onrender.com/api/v1";
</script>

<svelte:head>
    <title>SOS2526-30 Sobre Nosotros</title>
</svelte:head>

<div class="container">
    <header>
        <h1>SOS2526-30</h1>
        <p class="subtitle">Panel de Control del Proyecto - Información del equipo</p>
    </header>

    <h2>Descripción del Proyecto</h2>
    <p>Our sources of information are geared towards analysing the relationship between the growth of the esports industry, the earnings of esports players, cheating players in esports, and statistics on Olympic athletes.</p>

    <h2>Miembros del Equipo</h2>
    
    <div class="team-member">
        <div class="member-name">David Real Pérez</div>
        <div class="member-details">
            <code>esportsgrowth-stats</code>
            <a href="https://github.com/davreaper" target="_blank" class="btn-github">GitHub</a>
        </div>
    </div>

    <div class="team-member">
        <div class="member-name">Mario Ramos Tuñón</div>
        <div class="member-details">
            <code>esportsearnings-stats</code>
            <a href="https://github.com/MarioRt8558" target="_blank" class="btn-github">GitHub</a>
        </div>
    </div>

    <div class="team-member">
        <div class="member-name">Gonzalo García Gómez</div>
        <div class="member-details">
            <code>olympics-athlete-events</code>
            <a href="https://github.com/gonzaloogrcia" target="_blank" class="btn-github">GitHub</a>
        </div>
    </div>

    <div class="team-member">
        <div class="member-name">Francisco Manuel García Patino</div>
        <div class="member-details">
            <code>cheaters-stats</code>
            <a href="https://github.com/PaGarPa" target="_blank" class="btn-github">GitHub</a>
        </div>
    </div>

    <h2>Enlaces a las APIs</h2>
    <h3>Bases de las APIs</h3>

    <div class="api-item">
        <span class="api-name">Esports Growth:</span>
        <a href="/api/v1/esportsgrowth-stats" class="api-link">/api/v1/esportsgrowth-stats</a>
    </div>

    <div class="grid-2">
        <div class="api-item">
            <span class="api-name">Esports Earnings v1:</span>
            <a href="/api/v1/esportsearnings-stats" class="api-link">/api/v1/esportsearnings-stats</a>
        </div>
        <div class="api-item">
            <span class="api-name">Esports Earnings v2:</span>
            <a href="/api/v2/esportsearnings-stats" class="api-link">/api/v2/esportsearnings-stats</a>
        </div>
    </div>

    <div class="grid-2">
        <div class="api-item">
             <span class="api-name">Cheaters Stats v1:</span>
            <a href="/api/v1/cheaters-stats" class="api-link">/api/v1/cheaters-stats</a>
        </div>
        <div class="api-item">
            <span class="api-name">Cheaters Stats v2:</span>
            <a href="/api/v2/cheaters-stats" class="api-link">/api/v2/cheaters-stats</a>
        </div>
    </div>

    <div class="grid-2">
        <div class="api-item">
            <span class="api-name">Olympics v1:</span>
            <a href="/api/v1/olympics-athlete-events" class="api-link">/api/v1/olympics-athlete-events</a>
        </div>
        <div class="api-item">
            <span class="api-name">Olympics v2:</span>
            <a href="/api/v2/olympics-athlete-events" class="api-link">/api/v2/olympics-athlete-events</a>
        </div>
    </div>

    <h3>Documentación en Postman</h3>

    <div class="api-item">
        <span class="api-name">David Real Pérez:</span>
        <a href="/api/v1/esportsgrowth-stats/docs" class="api-link" target="_blank">/api/v1/esportsgrowth-stats/docs</a>
    </div>

    <div class="grid-2">
        <div class="api-item">
            <span class="api-name">Mario Ramos (Docs v1):</span>
            <a href="/api/v1/esportsearnings-stats/docs" class="api-link" target="_blank">/api/v1/esportsearnings-stats/docs</a>
        </div>
        <div class="api-item">
            <span class="api-name">Mario Ramos (Docs v2):</span>
            <a href="/api/v2/esportsearnings-stats/docs" class="api-link" target="_blank">/api/v2/esportsearnings-stats/docs</a>
        </div>
    </div>

    <div class="grid-2">
        <div class="api-item">
            <span class="api-name">Esports Earnings v1:</span>
            <a href="/api/v1/esportsearnings-stats/docs" class="api-link" target="_blank">/api/v1/esportsearnings-stats/docs</a>
        </div>
        <div class="api-item">
            <span class="api-name">Esports Earnings v2:</span>
            <a href="/api/v2/esportsearnings-stats/docs" class="api-link" target="_blank">/api/v2/esportsearnings-stats/docs</a>
        </div>
    </div>
    
    <div class="grid-2">
        <div class="api-item">
            <span class="api-name">Cheaters Stats v1:</span>
            <a href="/api/v1/cheaters-stats/docs" class="api-link" target="_blank">/api/v1/cheaters-stats/docs</a>
        </div>
        <div class="api-item">
            <span class="api-name">Cheaters Stats v2:</span>
            <a href="/api/v2/cheaters-stats/docs" class="api-link" target="_blank">/api/v2/cheaters-stats/docs</a>
        </div>
    </div>
    <div class="grid-2">
        <div class="api-item">
            <span class="api-name">Olympics v1:</span>
            <a href="/api/v1/olympics-athlete-events/docs" class="api-link" target="_blank">/api/v1/olympics-athlete-events/docs</a>
        </div>
        <div class="api-item">
            <span class="api-name">Olympics v2:</span>
            <a href="/api/v2/olympics-athlete-events/docs" class="api-link" target="_blank">/api/v2/olympics-athlete-events/docs</a>
        </div>
    </div>

    <hr>

    <h2>Repositorio</h2>
    <p>
        <a href={repoUrl} target="_blank">
            github.com/gti-sos/SOS2526-30
        </a>
    </p>

    <h2>URL del Proyecto</h2>
    <p>
        <a href="https://sos2526-30.onrender.com" target="_blank">
            sos2526-30.onrender.com
        </a>
    </p>
    
    <footer>
        <p>Proyecto SOS 2025-26 - Grupo 30</p>
    </footer>
</div>

<style>
    :root {
        --blue-50: #f0f9ff;
        --blue-100: #e0f2fe;
        --blue-200: #bae6fd;
        --blue-300: #7dd3fc;
        --blue-400: #38bdf8;
        --blue-500: #0ea5e9;
        --blue-600: #0284c7;
        --blue-700: #0369a1;
        --blue-800: #075985;
    }

    :global(body) {
        font-family: 'Segoe UI', sans-serif;
        margin: 0;
        padding: 20px;
        background: white;
        min-height: 100vh;
        color: #1e293b;
    }

    .container {
        max-width: 900px;
        margin: 0 auto;
        background: white;
        padding: 2rem;
        border-radius: 16px;
        border: 1px solid var(--blue-200);
    }

    header {
        text-align: center;
        margin-bottom: 3rem;
    }

    h1 {
        color: var(--blue-800);
        border-bottom: 3px solid var(--blue-500);
        padding-bottom: 0.5rem;
        margin-top: 0;
        font-size: 2.5rem;
    }

    .subtitle {
        font-size: 1.2rem;
        color: var(--blue-600);
        font-weight: 300;
        margin-top: 0;
    }

    h2 {
        color: var(--blue-700);
        margin-top: 2rem;
        font-size: 1.5rem;
    }

    h3 {
        color: var(--blue-600);
        margin: 1.5rem 0 0.5rem;
        font-size: 1.2rem;
    }

    .team-member {
        margin: 1rem 0;
        padding: 1rem;
        background: var(--blue-50);
        border-left: 4px solid var(--blue-500);
        border-radius: 8px;
    }

    .member-name {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--blue-800);
    }

    .member-details {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
    }

    code {
        background: var(--blue-100);
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        color: var(--blue-700);
        font-family: monospace;
    }

    .btn-github {
        background: var(--blue-600);
        color: white;
        padding: 0.2rem 0.8rem;
        border-radius: 16px;
        font-size: 0.8rem;
        text-decoration: none;
        display: inline-block;
    }
    .btn-github:hover {
        background: var(--blue-700);
    }

    .api-item {
        padding: 0.8rem;
        background: var(--blue-50);
        border-radius: 8px;
        margin: 0.5rem 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
    }

    .api-name {
        font-weight: 600;
        color: var(--blue-800);
        min-width: 150px;
    }

    .api-link {
        color: var(--blue-600);
        text-decoration: none;
        word-break: break-all;
        font-size: 0.9rem;
    }
    .api-link:hover {
        color: var(--blue-800);
        text-decoration: underline;
    }

    .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    hr {
        margin: 2rem 0;
        border: none;
        border-top: 2px solid var(--blue-200);
    }

    a {
        color: var(--blue-600);
        text-decoration: none;
    }
    a:hover {
        text-decoration: underline;
        color: var(--blue-800);
    }

    footer {
        text-align: center;
        color: var(--blue-600);
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 2px solid var(--blue-200);
    }

    footer p {
        margin: 0;
        font-size: 0.9rem;
    }
</style>