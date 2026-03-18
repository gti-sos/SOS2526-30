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

<h1>🚀 SOS2526-30 - Panel de Control del Proyecto</h1>

<section>
    <h2>👥 Miembros del Equipo y sus Fuentes de Datos</h2>
    <ul>
        {#each team as member}
            <li>
                <strong>{member.name}</strong>: 
                <code>{member.dataSource}</code> 
                (<a href={member.github} target="_blank" rel="noreferrer">GitHub</a>)
            </li>
        {/each}
    </ul>
</section>

<section>
    <h2>🔗 Enlaces a los Front-ends (Svelte) de cada miembro</h2>
    <p><em>(Estos enlaces apuntarán a las vistas individuales que cada uno desarrolle)</em></p>
    <ul>
        <li><a href="/frontend/david">Front-end de David</a></li>
        <li><a href="/frontend/mario">Front-end de Mario</a></li>
        <li><a href="/frontend/gonzalo">Front-end de Gonzalo</a></li>
        <li><a href="/frontend/francisco">Front-end de Francisco</a></li>
    </ul>
    <p>⚒️ <i>Rutas de ejemplo. Deberán ser reemplazadas por las rutas reales que cada miembro cree.</i></p>
</section>

<section>
    <h2>📡 URLs Base de las APIs Desarrolladas</h2>
    <ul>
        {#each team as member}
            <li>
                <a href={`${baseApiUrl}/${member.dataSource}`} target="_blank" rel="noreferrer">
                    <code>{baseApiUrl}/{member.dataSource}</code>
                </a>
            </li>
        {/each}
    </ul>
</section>

<section>
    <h2>📄 Documentación en Postman</h2>
    <ul>
        {#each team as member}
            <li>
                <a href={`${baseApiUrl}/${member.dataSource}/docs`} target="_blank" rel="noreferrer">
                    Documentación de {member.name} ({member.dataSource})
                </a>
            </li>
        {/each}
    </ul>
</section>

<section>
    <h2>📦 Repositorio en GitHub</h2>
    <p><a href={repoUrl} target="_blank" rel="noreferrer">{repoUrl}</a></p>
</section>

<style>
    section {
        margin-bottom: 2rem;
        padding: 1rem;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
    }
    h1 {
        color: #333;
        border-bottom: 2px solid #007bff;
        padding-bottom: 0.5rem;
    }
    h2 {
        color: #555;
        margin-top: 0;
    }
    ul {
        list-style: none;
        padding: 0;
    }
    li {
        margin: 0.5rem 0;
        padding: 0.3rem;
        background-color: white;
        border-left: 3px solid #007bff;
    }
    a {
        color: #007bff;
        text-decoration: none;
    }
    a:hover {
        text-decoration: underline;
    }
    code {
        background-color: #eee;
        padding: 2px 5px;
        border-radius: 4px;
    }
</style>