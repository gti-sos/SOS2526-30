<script>
// @ts-nocheck
    // Información del equipo
    const team = [
        { name: "David Real Pérez", dataSource: "esportsgrowth-stats", github: "https://github.com/davreaper" },
        { name: "Mario Ramos Tuñón", dataSource: "esportsearnings-stats", github: "https://github.com/MarioRt8558" },
        { name: "Gonzalo García Gómez", dataSource: "olympics-athlete-events", github: "https://github.com/gonzaloogrcia" },
        { name: "Francisco Manuel García Patino", dataSource: "cheaters-stats", github: "https://github.com/PaGarPa" }
    ];

    const repoUrl = "https://github.com/gti-sos/SOS2526-30";
    
    // Variable de entorno para la URL base de la API
    const baseApiUrl = "https://sos2526-30.onrender.com/api/v1";
    
    // URLs de documentación específicas
    const docUrls = {
        "David Real Pérez": `${baseApiUrl}/esportsgrowth-stats/docs`,
        "Mario Ramos Tuñón": {
            v1: `${baseApiUrl}/esportsearnings-stats/docs`,
            v2: `https://sos2526-30.onrender.com/api/v2/esportsearnings-stats/docs`
        },
        "Gonzalo García Gómez": {
            v1: `${baseApiUrl}/olympics-athlete-events/docs`,
            v2: `https://sos2526-30.onrender.com/api/v2/olympics-athlete-events/docs`
        },
        "Francisco Manuel García Patino": {
            v1: `${baseApiUrl}/cheaters-stats/docs`,
            v2: `https://sos2526-30.onrender.com/api/v2/cheaters-stats/docs`
        }
    };
</script>

<svelte:head>
    <title>SOS2526-30 - Panel de Control</title>
</svelte:head>

<div class="cards-grid">
    <section class="card">
        <h2>Miembros del Equipo</h2>
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

    <section class="card">
        <h2>Front-ends Individuales</h2>
        <p class="card-note"><em>Vistas individuales de cada miembro</em></p>
        <ul class="links-list">
            <li><a href="/esportsgrowth-stats" class="highlight-link">David - Esports Growth Stats</a></li>
            <li><a href="/esportsearnings-stats" class="highlight-link">Mario - Esportsearnings Stats (v2)</a></li>
            <li><a href="/olympics-athlete-events" class="highlight-link">Gonzalo - Olympics Athlete Events (v2)</a></li>
            <li><a href="/cheaters-stats" class="highlight-link">Francisco - Cheaters Stats (v2)</a></li>
        </ul>
    </section>

    <section class="card">
        <h2>APIs Base</h2>
        <ul class="links-list">
            {#each team as member}
                <li>
                    <a href={`${baseApiUrl}/${member.dataSource}`} target="_blank" rel="noreferrer">
                        <code>{member.dataSource}</code>
                    </a>
                    {#if member.name === "Gonzalo García Gómez" || member.name === "Francisco Manuel García Patino" || member.name === "Mario Ramos Tuñón"}
                        <a href={`${baseApiUrl}/${member.dataSource}/loadInitialData`} target="_blank" rel="noreferrer" class="version-link">
                            <code>v1</code>
                        </a>
                        <a href={`https://sos2526-30.onrender.com/api/v2/${member.dataSource}/loadInitialData`} target="_blank" rel="noreferrer" class="version-link">
                            <code class="v2-code">v2</code>
                        </a>
                    {/if}
                </li>
            {/each}
        </ul>
    </section>

    <section class="card">
        <h2>Postman Docs</h2>
        <ul class="links-list">
            {#each team as member}
                <li>
                    <span class="doc-name">{member.name.split(' ')[0]}</span>
                    {#if member.name === "Gonzalo García Gómez" || member.name === "Francisco Manuel García Patino" || member.name === "Mario Ramos Tuñón"}
                        <div class="doc-versions">
                            <a href={docUrls[member.name].v1} target="_blank" rel="noreferrer" class="version-doc">
                                v1
                            </a>
                            <a href={docUrls[member.name].v2} target="_blank" rel="noreferrer" class="version-doc v2">
                                v2
                            </a>
                        </div>
                    {:else}
                        <a href={docUrls[member.name]} target="_blank" rel="noreferrer">
                            <small>{member.dataSource}</small>
                        </a>
                    {/if}
                </li>
            {/each}
        </ul>
    </section>

    <section class="card full-width">
        <h2>Repositorio</h2>
        <p><a href={repoUrl} target="_blank" rel="noreferrer" class="repo-link">{repoUrl}</a></p>
    </section>

    <!-- Sección de Videos Entregable D03 -->
    <section class="card full-width video-section">
        <h2>📹 Videos Entregable D03</h2>
        <ul class="video-list">
            <li>
                <a href="https://youtu.be/MDm96x4fNVo" target="_blank" rel="noreferrer" class="video-link">
                    🎥 Francisco Manuel García Patino - Cheaters Stats
                </a>
            </li>
        </ul>
    </section>
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

    .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }

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
        font-style: italic;
    }

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

    .team-list li {
        display: flex;
        flex-direction: column;
        border-left: 3px solid var(--celeste-400);
    }

    .member-name {
        font-weight: 600;
        color: var(--celeste-800);
        margin-bottom: 0.3rem;
        font-size: 1.1rem;
    }

    .member-details {
        display: flex;
        align-items: center;
        gap: 0.8rem;
        font-size: 0.9rem;
        flex-wrap: wrap;
    }

    .datasource {
        background-color: var(--celeste-100);
        color: var(--celeste-700);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.85rem;
    }

    .github-link {
        background-color: var(--celeste-600);
        color: white;
        padding: 0.2rem 0.8rem;
        border-radius: 16px;
        font-size: 0.8rem;
        font-weight: 500;
        text-decoration: none;
    }

    .github-link:hover {
        background-color: var(--celeste-700);
        color: white;
        text-decoration: none;
    }

    .version-link {
        margin-left: 0.5rem;
        text-decoration: none;
    }

    .version-link code {
        background-color: var(--celeste-100);
        color: var(--celeste-700);
        padding: 0.1rem 0.4rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: normal;
    }

    .version-link:hover code {
        background-color: var(--celeste-200);
    }

    .version-link .v2-code {
        background-color: #ede9fe;
        color: #6d28d9;
    }

    .version-link:hover .v2-code {
        background-color: #ddd6fe;
    }

    .highlight-link {
        font-weight: bold;
        color: var(--celeste-600);
    }

    .highlight-link:hover {
        color: var(--celeste-800);
    }

    .doc-versions {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.3rem;
    }

    .version-doc {
        background-color: var(--celeste-100);
        color: var(--celeste-700);
        padding: 0.2rem 0.6rem;
        border-radius: 12px;
        font-size: 0.8rem;
        text-decoration: none;
        font-weight: 500;
    }

    .version-doc:hover {
        background-color: var(--celeste-200);
        text-decoration: none;
    }

    .version-doc.v2 {
        background-color: #ede9fe;
        color: #6d28d9;
    }

    .version-doc.v2:hover {
        background-color: #ddd6fe;
    }

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
        color: var(--celeste-800);
    }

    .links-list li a small {
        color: var(--celeste-500);
        font-size: 0.8rem;
    }

    /* Estilos para la sección de videos */
    .video-section {
        background: linear-gradient(135deg, #ffffff 0%, var(--celeste-50) 100%);
    }

    .video-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .video-list li {
        margin: 0.5rem 0;
        padding: 0.5rem;
    }

    .video-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 1rem;
        font-weight: 500;
        color: var(--celeste-700);
        background-color: white;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: 1px solid var(--celeste-300);
        transition: all 0.3s ease;
    }

    .video-link:hover {
        background-color: var(--celeste-100);
        border-color: var(--celeste-500);
        transform: translateX(5px);
        text-decoration: none;
    }

    @media (max-width: 640px) {
        .cards-grid {
            grid-template-columns: 1fr;
        }
    }
</style>