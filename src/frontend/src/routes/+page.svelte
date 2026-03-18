<script>
    // Información del equipo
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
    <title>SOS2526-30 - Panel de Control</title>
</svelte:head>

<div class="container">
    <header>
        <h1>🚀 SOS2526-30</h1>
        <p class="subtitle">Panel de Control del Proyecto</p>
    </header>

    <div class="cards-grid">
        <!-- Tarjeta: Miembros del Equipo -->
        <section class="card">
            <h2>👥 Miembros del Equipo</h2>
            <ul class="team-list">
                {#each team as member}
                    <li>
                        <span class="member-name">{member.name}</span>
                        <div class="member-details">
                            <code class="datasource">{member.dataSource}</code>
                            <a href={member.github} target="_blank" rel="noreferrer" class="github-link">GitHub</a>
                        </div>
                    </li>
                {/each}
            </ul>
        </section>

        <!-- Tarjeta: Front-ends Individuales -->
        <section class="card">
            <h2>🔗 Front-ends</h2>
            <p class="card-note"><em>Vistas individuales de cada miembro</em></p>
            <ul class="links-list">
                <li><a href="/frontend/david">Front-end de David</a></li>
                <li><a href="/frontend/mario">Front-end de Mario</a></li>
                <li><a href="/frontend/gonzalo">Front-end de Gonzalo</a></li>
                <li><a href="/frontend/francisco">Front-end de Francisco</a></li>
            </ul>
        </section>

        <!-- Tarjeta: URLs Base de las APIs -->
        <section class="card">
            <h2>📡 APIs Base</h2>
            <ul class="links-list">
                {#each team as member}
                    <li>
                        <a href={`${baseApiUrl}/${member.dataSource}`} target="_blank" rel="noreferrer">
                            <code>{member.dataSource}</code>
                        </a>
                    </li>
                {/each}
            </ul>
        </section>

        <!-- Tarjeta: Documentación Postman -->
        <section class="card">
            <h2>📄 Postman Docs</h2>
            <ul class="links-list">
                {#each team as member}
                    <li>
                        <a href={`${baseApiUrl}/${member.dataSource}/docs`} target="_blank" rel="noreferrer">
                            <span class="doc-name">{member.name.split(' ')[0]}</span>
                            <small>{member.dataSource}</small>
                        </a>
                    </li>
                {/each}
            </ul>
        </section>

        
        <section class="card full-width">
            <h2>📦 Repositorio</h2>
            <p><a href={repoUrl} target="_blank" rel="noreferrer" class="repo-link">{repoUrl}</a></p>
        </section>
    </div>

    <footer>
        <p>✨ Proyecto SOS 2025-26 - Grupo 30</p>
    </footer>
</div>

<style>
   
    :root {
        --celeste-50: #f0f9ff;
        --celeste-100: #e0f2fe;
        --celeste-200: #bae6fd;
        --celeste-300: #7dd3fc;
        --celeste-400: #38bdf8;
        --celeste-500: #0ea5e9;
        --celeste-600: #0284c7;
        --celeste-700: #0369a1;
        --celeste-800: #075985;
        --celeste-900: #0c4a6e;
    }

    /* Estilos generales */
    body {
        background: linear-gradient(135deg, var(--celeste-50) 0%, var(--celeste-100) 100%);
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        margin: 0;
        min-height: 100vh;
    }

    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    /* Header */
    header {
        text-align: center;
        margin-bottom: 3rem;
    }

    h1 {
        font-size: 3rem;
        color: var(--celeste-800);
        margin-bottom: 0.5rem;
        text-shadow: 2px 2px 4px rgba(2, 132, 199, 0.2);
    }

    .subtitle {
        font-size: 1.2rem;
        color: var(--celeste-600);
        font-weight: 300;
        margin-top: 0;
    }

    /* Grid de tarjetas */
    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    /* Tarjetas */
    .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.1), 0 2px 4px -1px rgba(2, 132, 199, 0.06);
        transition: all 0.3s ease;
        border: 1px solid var(--celeste-200);
    }

    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 25px -5px rgba(2, 132, 199, 0.2), 0 10px 10px -5px rgba(2, 132, 199, 0.1);
        border-color: var(--celeste-300);
    }

    .full-width {
        grid-column: 1 / -1;
    }

    /* Títulos de tarjetas */
    h2 {
        color: var(--celeste-700);
        font-size: 1.5rem;
        margin-top: 0;
        margin-bottom: 1.2rem;
        border-bottom: 2px solid var(--celeste-200);
        padding-bottom: 0.5rem;
    }

    .card-note {
        color: var(--celeste-500);
        font-size: 0.9rem;
        margin-top: -0.5rem;
        margin-bottom: 1rem;
    }

    /* Listas */
    ul {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    li {
        margin: 0.8rem 0;
        padding: 0.5rem;
        border-radius: 8px;
        transition: background-color 0.2s ease;
    }

    li:hover {
        background-color: var(--celeste-50);
    }

    /* Estilos específicos para la lista de miembros */
    .team-list li {
        display: flex;
        flex-direction: column;
        border-left: 3px solid var(--celeste-400);
    }

    .member-name {
        font-weight: 600;
        color: var(--celeste-800);
        margin-bottom: 0.3rem;
    }

    .member-details {
        display: flex;
        align-items: center;
        gap: 1rem;
        font-size: 0.9rem;
    }

    .datasource {
        background-color: var(--celeste-100);
        color: var(--celeste-700);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.85rem;
    }

    /* Enlaces */
    a {
        color: var(--celeste-600);
        text-decoration: none;
        font-weight: 500;
        transition: color 0.2s ease;
    }

    a:hover {
        color: var(--celeste-800);
        text-decoration: underline;
    }

    .github-link {
        background-color: var(--celeste-600);
        color: white;
        padding: 0.2rem 0.8rem;
        border-radius: 16px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .github-link:hover {
        background-color: var(--celeste-700);
        color: white;
        text-decoration: none;
    }

    .repo-link {
        font-size: 1.1rem;
        word-break: break-all;
        color: var(--celeste-600);
        font-weight: 600;
    }

    .links-list li a {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.3rem 0;
    }

    .links-list li a code {
        background-color: var(--celeste-100);
        color: var(--celeste-700);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-size: 0.9rem;
    }

    .doc-name {
        font-weight: 600;
        min-width: 70px;
    }

    .links-list li a small {
        color: var(--celeste-500);
        font-size: 0.8rem;
    }

    /* Footer */
    footer {
        text-align: center;
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 2px solid var(--celeste-200);
        color: var(--celeste-600);
    }

    footer p {
        margin: 0;
        font-size: 0.9rem;
    }

    /* Responsive */
    @media (max-width: 640px) {
        .container {
            padding: 1rem;
        }
        
        h1 {
            font-size: 2rem;
        }
        
        .cards-grid {
            grid-template-columns: 1fr;
        }
    }
</style>