    <script>
    // @ts-nocheck

        import { onMount } from 'svelte';
        import Highcharts from 'highcharts';

        let loading = $state(true);
        let error = $state(null);
        let chart = null;
        let combinedData = [];

        async function fetchAthletesByYear() {
            console.log('[FETCH] Obteniendo atletas por año...');
            try {
                const res = await fetch('/api/v1/olympics-athlete-events/loadInitialData?limit=5000');
                const data = await res.json();
                const athletes = data;

                const athletesByYear = {};
                athletes.forEach(ath => {
                    const year = ath.year;
                    if (year && year >= 2000 && year <= 2025) {
                        athletesByYear[year] = (athletesByYear[year] || 0) + 1;
                    }
                });
                return athletesByYear;
            } catch (err) {
                console.error('[FETCH] Error:', err);
                throw err;
            }
        }

        async function fetchRandomUser(year) {
    try {
        const url = `/api/random-proxy/user?seed=${year}`;
        console.log(`[RANDOMUSER] Llamando para año ${year} con seed ${year}`);
        
        const res = await fetch(url);
        
        if (!res.ok) {
            console.warn(`[RANDOMUSER] HTTP ${res.status} para año ${year}`);
            return {
                year: year,
                name: 'No disponible',
                country: 'No disponible',
                email: 'no@disponible.com',
                age: 0,
                gender: 'unknown'
            };
        }
        
        const data = await res.json();
        
        // Verificar que data.results existe y tiene elementos
        if (!data.results || !data.results[0]) {
            console.warn(`[RANDOMUSER] Respuesta vacía para año ${year}`);
            return {
                year: year,
                name: 'No disponible',
                country: 'No disponible',
                email: 'no@disponible.com',
                age: 0,
                gender: 'unknown'
            };
        }
        
        const user = data.results[0];
        
        return {
            year: year,
            name: user.name ? `${user.name.first} ${user.name.last}` : 'No nombre',
            country: user.location?.country || 'No país',
            email: user.email || 'no@email.com',
            age: user.dob?.age || 0,
            gender: user.gender || 'unknown'
        };
        
    } catch (err) {
        console.error(`[RANDOMUSER] Error para año ${year}:`, err.message);
        return {
            year: year,
            name: 'Error',
            country: 'Error',
            email: 'error@error.com',
            age: 0,
            gender: 'unknown'
        };
    }
}

        async function loadData() {
            try {
                loading = true;
                
                const overlay = document.querySelector('.loading-overlay');
                if (overlay) {
                    overlay.style.display = 'flex';
                }

                const athletesByYear = await fetchAthletesByYear();
                
                // Obtener años con atletas
                const yearsWithAthletes = Object.keys(athletesByYear).map(Number).sort();
                
                // Para cada año con atletas, obtener un usuario aleatorio
                const userPromises = yearsWithAthletes.map(year => fetchRandomUser(year));
                const users = await Promise.all(userPromises);
                
                // Combinar datos
                combinedData = yearsWithAthletes.map(year => {
                    const user = users.find(u => u.year === year);
                    return {
                        year: year,
                        athletes: athletesByYear[year] || 0,
                        name: user?.name || 'No user',
                        country: user?.country || 'Unknown',
                        email: user?.email || '',
                        age: user?.age || 0,
                        gender: user?.gender || 'unknown'
                    };
                });

                await createChart();
                
                loading = false;
                
                if (overlay) {
                    overlay.style.display = 'none';
                }
                
            } catch (e) {
                console.error('[LOAD] Error:', e);
                error = 'Error al cargar datos. Inténtalo de nuevo más tarde.';
                loading = false;
                const overlay = document.querySelector('.loading-overlay');
                if (overlay) {
                    overlay.style.display = 'none';
                }
            }
        }

        async function createChart() {
            return new Promise((resolve) => {
                const container = document.getElementById('scatter-container');
                
                if (!container) {
                    console.error('[CHART] Contenedor no encontrado, reintentando...');
                    setTimeout(() => createChart().then(resolve), 500);
                    return;
                }

                if (chart) {
                    chart.destroy();
                }

                const scatterData = combinedData
                    .filter(d => d.athletes > 0)
                    .map(d => ({
                        x: d.year,
                        y: d.age,
                        athletes: d.athletes,
                        name: d.name,
                        country: d.country,
                        email: d.email,
                        gender: d.gender
                    }));

                if (scatterData.length === 0) {
                    console.warn('[CHART] No hay datos para mostrar');
                    resolve();
                    return;
                }

                chart = Highcharts.chart('scatter-container', {
                    chart: {
                        type: 'scatter',
                        zoomType: 'xy',
                        height: 500,
                        backgroundColor: '#ffffff',
                        events: {
                            load: function() {
                                console.log('[CHART] Gráfico cargado completamente');
                                resolve();
                            }
                        }
                    },
                    title: {
                        text: `Atletas Olímpicos vs Edad de Usuarios Aleatorios`,
                        style: { fontSize: '16px' }
                    },
                    subtitle: {
                        text: 'Cada punto representa un año | Eje Y = Edad de un usuario aleatorio',
                        style: { fontSize: '12px' }
                    },
                    accessibility: {
                        enabled: false
                    },
                    xAxis: {
                        title: { text: 'Año' },
                        tickInterval: 2,
                        min: 2000,
                        max: 2025,
                        gridLineWidth: 1,
                        gridLineColor: '#e2e8f0'
                    },
                    yAxis: {
                        title: { text: 'Edad del usuario (años)' },
                        gridLineWidth: 1,
                        gridLineColor: '#e2e8f0',
                        min: 0,
                        max: 100
                    },
                    tooltip: {
                        pointFormat: `
                            <b>Año: {point.x}</b><br/>
                            🏅 Atletas: {point.athletes}<br/>
                            👤 Usuario: {point.name}<br/>
                            🌍 País: {point.country}<br/>
                            📧 Email: {point.email}<br/>
                            🧒 Género: {point.gender}<br/>
                            🎂 Edad: {point.y}
                        `
                    },
                    plotOptions: {
                        scatter: {
                            marker: {
                                radius: 10,
                                symbol: 'circle',
                                states: {
                                    hover: { enabled: true, lineColor: 'black', lineWidth: 2 }
                                }
                            }
                        }
                    },
                    series: [{
                        name: 'Usuarios aleatorios',
                        data: scatterData,
                        color: '#0284c7'
                    }]
                });
            });
        }

        onMount(() => {
            console.log('[MOUNT] Componente montado');
            loadData();
        });
    </script>

    <div class="integration-container">
        <h1>Atletas Olímpicos vs Edad de Usuarios Aleatorios</h1>
        <p class="subtitle">Comparativa por año entre número de atletas y edad de un usuario aleatorio (Random User API)</p>

        <div class="info-api">
            <p><strong>API 1 (propia):</strong> Olympics Athlete Events</p>
            <p><strong>API 2 (externa):</strong> Random User API - Usuarios aleatorios</p>
            <p><strong>Widget:</strong> Scatter con Highcharts</p>
            <p><strong>Eje Y:</strong> Edad del usuario aleatorio</p>
        </div>

        <div class="loading-overlay" style="display: flex;">
            <div class="spinner"></div>
            <p>Cargando datos...</p>
        </div>

        {#if error}
            <div class="error">
                <p>Error: {error}</p>
            </div>
        {/if}

        <div id="scatter-container" style="height: 550px; width: 100%; margin-bottom: 2rem;"></div>

        {#if !loading}
            <div class="table-container">
                <h3>Datos combinados por año</h3>
                <div class="table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Año</th>
                                <th>Atletas</th>
                                <th>Usuario</th>
                                <th>País</th>
                                <th>Edad</th>
                                <th>Género</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each combinedData as item}
                                <tr>
                                    <td><strong>{item.year}</strong></td>
                                    <td>{item.athletes.toLocaleString()}</td>
                                    <td>{item.name}</td>
                                    <td>{item.country}</td>
                                    <td>{item.age}</td>
                                    <td>{item.gender}</td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
                <p class="table-info">Años con datos: {combinedData.length}</p>
            </div>
        {/if}

        <div class="info">
            <h3>Interpretación</h3>
            <ul>
                <li><strong>Tipo de gráfico:</strong> Scatter con Highcharts</li>
                <li><strong>Cada punto:</strong> Representa un año</li>
                <li><strong>Eje X:</strong> Año</li>
                <li><strong>Eje Y:</strong> Edad de un usuario aleatorio (Random User API)</li>
                <li><strong>Tooltip:</strong> Muestra detalles del usuario</li>
                <li><strong>Random User API:</strong> Sin API key, estable, sin límites</li>
            </ul>
        </div>
    </div>

    <style>
        .integration-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            position: relative;
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
            margin-bottom: 1rem;
        }

        .info-api {
            background: #f0f9ff;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            margin-bottom: 1.5rem;
            font-size: 0.85rem;
            border-left: 4px solid #0284c7;
        }

        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            border-radius: 16px;
            z-index: 100;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #0284c7;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error {
            text-align: center;
            padding: 2rem;
            margin-top: 1rem;
            color: #dc2626;
            background: #fee2e2;
            border-radius: 8px;
        }

        .table-container {
            margin-top: 2rem;
            border-top: 1px solid #e2e8f0;
            padding-top: 1rem;
        }

        .table-container h3 {
            color: #0369a1;
            margin-bottom: 1rem;
        }

        .table-wrapper {
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }

        th, td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }

        th {
            background: #f8fafc;
            font-weight: 600;
            color: #0369a1;
            position: sticky;
            top: 0;
        }

        tr:hover {
            background: #f0f9ff;
        }

        .table-info {
            margin-top: 1rem;
            font-size: 0.85rem;
            color: #666;
            text-align: right;
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