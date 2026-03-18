<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>SOS2526-30 - Sobre Nosotros</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
            min-height: 100vh;
            color: #1e293b;
        }
        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(2, 132, 199, 0.2);
            border: 1px solid #bae6fd;
        }
        h1 {
            color: #075985;
            border-bottom: 3px solid #0284c7;
            padding-bottom: 0.5rem;
            margin-top: 0;
            font-size: 2.5rem;
        }
        h2 {
            color: #0369a1;
            margin-top: 2rem;
            font-size: 1.8rem;
        }
        h3 {
            color: #0284c7;
            margin-top: 1.5rem;
            font-size: 1.3rem;
        }
        ul {
            list-style: none;
            padding: 0;
        }
        li {
            margin: 1rem 0;
            padding: 1rem;
            background: #f0f9ff;
            border-left: 4px solid #38bdf8;
            border-radius: 8px;
        }
        a {
            color: #0284c7;
            text-decoration: none;
            font-weight: 500;
        }
        a:hover {
            text-decoration: underline;
            color: #075985;
        }
        code {
            background: #e0f2fe;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            font-family: monospace;
            color: #0369a1;
        }
        .footer {
            margin-top: 2rem;
            text-align: center;
            color: #64748b;
            font-size: 0.9rem;
        }
        .team-member {
            display: flex;
            flex-direction: column;
        }
        .member-name {
            font-size: 1.1rem;
            font-weight: 600;
            color: #075985;
        }
        .member-details {
            display: flex;
            gap: 1rem;
            margin-top: 0.3rem;
            font-size: 0.9rem;
        }
        .member-github {
            background: #0284c7;
            color: white;
            padding: 0.2rem 0.8rem;
            border-radius: 16px;
            font-size: 0.8rem;
        }
        .member-github:hover {
            background: #075985;
            color: white;
            text-decoration: none;
        }
        .api-item {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .api-name {
            font-weight: 600;
            min-width: 150px;
        }
        .api-link {
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SOS2526-30</h1>
        <p style="font-size: 1.2rem; color: #475569;">Panel de Control del Proyecto - Información del equipo</p>

        <h2>📋 Descripción del Proyecto</h2>
        <p>Our sources of information are geared towards analysing the relationship between the growth of the esports industry, the earnings of esports players, cheating players in esports, and statistics on Olympic athletes.</p>

        <h2>👥 Miembros del Equipo</h2>
        <ul>
            <li>
                <div class="team-member">
                    <span class="member-name">David Real Pérez</span>
                    <div class="member-details">
                        <code>esportsgrowth-stats</code>
                        <a href="https://github.com/davreaper" target="_blank" class="member-github">GitHub</a>
                    </div>
                </div>
            </li>
            <li>
                <div class="team-member">
                    <span class="member-name">Mario Ramos Tuñón</span>
                    <div class="member-details">
                        <code>esportsearnings-stats</code>
                        <a href="https://github.com/MarioRt8558" target="_blank" class="member-github">GitHub</a>
                    </div>
                </div>
            </li>
            <li>
                <div class="team-member">
                    <span class="member-name">Gonzalo García Gómez</span>
                    <div class="member-details">
                        <code>olympics-athlete-events</code>
                        <a href="https://github.com/gonzaloogrcia" target="_blank" class="member-github">GitHub</a>
                    </div>
                </div>
            </li>
            <li>
                <div class="team-member">
                    <span class="member-name">Francisco Manuel García Patino</span>
                    <div class="member-details">
                        <code>cheaters-stats</code>
                        <a href="https://github.com/PaGarPa" target="_blank" class="member-github">GitHub</a>
                    </div>
                </div>
            </li>
        </ul>

        <h2>🔗 Enlaces a las APIs</h2>
        <h3>Bases de las APIs</h3>
        <ul>
            <li>
                <div class="api-item">
                    <span class="api-name">Esports Growth:</span>
                    <a href="/api/v1/esportsgrowth-stats" class="api-link">/api/v1/esportsgrowth-stats</a>
                </div>
            </li>
            <li>
                <div class="api-item">
                    <span class="api-name">Esports Earnings:</span>
                    <a href="/api/v1/esportsearnings-stats" class="api-link">/api/v1/esportsearnings-stats</a>
                </div>
            </li>
            <li>
                <div class="api-item">
                    <span class="api-name">Cheaters Stats:</span>
                    <a href="/api/v1/cheaters-stats" class="api-link">/api/v1/cheaters-stats</a>
                </div>
            </li>
            <li>
                <div class="api-item">
                    <span class="api-name">Olympics Athlete:</span>
                    <a href="/api/v1/olympics-athlete-events" class="api-link">/api/v1/olympics-athlete-events</a>
                </div>
            </li>
        </ul>

        <h3>📄 Documentación en Postman</h3>
        <ul>
            <li>
                <div class="api-item">
                    <span class="api-name">David Real Pérez:</span>
                    <a href="/api/v1/esportsgrowth-stats/docs" class="api-link" target="_blank">/api/v1/esportsgrowth-stats/docs</a>
                </div>
            </li>
            <li>
                <div class="api-item">
                    <span class="api-name">Mario Ramos Tuñón:</span>
                    <a href="/api/v1/esportsearnings-stats/docs" class="api-link" target="_blank">/api/v1/esportsearnings-stats/docs</a>
                </div>
            </li>
            <li>
                <div class="api-item">
                    <span class="api-name">Francisco M. García:</span>
                    <a href="/api/v1/cheaters-stats/docs" class="api-link" target="_blank">/api/v1/cheaters-stats/docs</a>
                </div>
            </li>
            <li>
                <div class="api-item">
                    <span class="api-name">Gonzalo García Gómez:</span>
                    <a href="/api/v1/olympics-athlete-events/docs" class="api-link" target="_blank">/api/v1/olympics-athlete-events/docs</a>
                </div>
            </li>
        </ul>

        <h2>📦 Repositorio</h2>
        <p>
            <a href="https://github.com/gti-sos/SOS2526-30" target="_blank">
                github.com/gti-sos/SOS2526-30
            </a>
        </p>

        <h2>🌐 URL del Proyecto</h2>
        <p>
            <a href="https://sos2526-30.onrender.com" target="_blank">
                sos2526-30.onrender.com
            </a>
        </p>

        <div class="footer">
            <p>✨ Proyecto SOS 2025-26 - Grupo 30</p>
            <p>Desarrollado con ❤️ por el equipo</p>
        </div>
    </div>
</body>
</html>