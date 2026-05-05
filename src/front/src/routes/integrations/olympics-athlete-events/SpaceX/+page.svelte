    <script>
    // @ts-nocheck

        import { onMount } from 'svelte';
        import Chart from 'chart.js/auto';
        
        let loading = $state(true);
        let error = $state(null);
        let chart = $state(null);
        // @ts-ignore
        let combinedData = [];
        
        onMount(async () => {
            await fetchData();
        });
        
        async function fetchData() {
            try {
                loading = true;
                
                // 1. Obtener datos de Olympics - atletas por año
                const resOlympics = await fetch('https://sos2526-30.onrender.com/api/v1/olympics-athlete-events/loadInitialData');
                const olympicsData = await resOlympics.json();
                const athletes = olympicsData;
                
                // Contar atletas por año (2000-2024)
                const athletesByYear = {};
                // @ts-ignore
                athletes.forEach(ath => {
                    const year = ath.year;
                    if (year && year >= 1900 && year <= 2024) {
                        // @ts-ignore
                        athletesByYear[year] = (athletesByYear[year] || 0) + 1;
                    }
                });
                
                // 2. Obtener datos de SpaceX
                const resSpaceX = await fetch('https://api.spacexdata.com/v4/launches');
                const launches = await resSpaceX.json();
                
                
                // Contar lanzamientos por año
                const launchesByYear = {};
                // @ts-ignore
                launches.forEach(launch => {
                    const date = new Date(launch.date_utc);
                    const year = date.getFullYear();
                    if (year >= 1900 && year <= 2024) {
                        // @ts-ignore
                        launchesByYear[year] = (launchesByYear[year] || 0) + 1;
                    }
                });
                
                // 3. Combinar datos
                const allYears = new Set([...Object.keys(athletesByYear), ...Object.keys(launchesByYear)]);
                
                combinedData = Array.from(allYears)
                    .map(year => ({
                        year: parseInt(year),
                        // @ts-ignore
                        athletes: athletesByYear[year] || 0,
                        // @ts-ignore
                        launches: launchesByYear[year] || 0
                    }))
                    .sort((a, b) => a.year - b.year);
                
                await createChart();
                loading = false;
                
                const overlay = document.querySelector('.loading-overlay');
                // @ts-ignore
                if (overlay) overlay.style.display = 'none';
                
            } catch (e) {
                console.error('Error:', e);
                // @ts-ignore
                error = e.message;
                loading = false;
                const overlay = document.querySelector('.loading-overlay');
                // @ts-ignore
                if (overlay) overlay.style.display = 'none';
            }
        }
        
        async function createChart() {
            // @ts-ignore
            const ctx = document.getElementById('area-chart').getContext('2d');
            
            // @ts-ignore
            if (chart) chart.destroy();
            
            // @ts-ignore
            const years = combinedData.map(d => d.year);
            // @ts-ignore
            const athletesData = combinedData.map(d => d.athletes);
            // @ts-ignore
            const launchesData = combinedData.map(d => d.launches);
            
            // Normalizar para escala
            const maxAthletes = Math.max(...athletesData, 1);
            const maxLaunches = Math.max(...launchesData, 1);
            
            const athletesPercent = athletesData.map(v => (v / maxAthletes) * 100);
            const launchesPercent = launchesData.map(v => (v / maxLaunches) * 100);
            
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: 'Atletas Olímpicos',
                            data: athletesPercent,
                            borderColor: '#0284c7',
                            backgroundColor: 'rgba(2, 132, 199, 0.3)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#0284c7'
                        },
                        {
                            label: 'Lanzamientos SpaceX',
                            data: launchesPercent,
                            borderColor: '#f97316',
                            backgroundColor: 'rgba(249, 115, 22, 0.3)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4,
                            pointRadius: 4,
                            pointBackgroundColor: '#f97316'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const index = context.dataIndex;
                                    const dataset = context.dataset;
                                    const value = dataset.data[index];
                                    if (dataset.label === 'Atletas Olímpicos') {
                                        // @ts-ignore
                                        return `${dataset.label}: ${athletesData[index]} atletas (${value.toFixed(1)}%)`;
                                    } else {
                                        // @ts-ignore
                                        return `${dataset.label}: ${launchesData[index]} lanzamientos (${value.toFixed(1)}%)`;
                                    }
                                }
                            }
                        },
                        legend: {
                            position: 'bottom'
                        }
                    },
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Año',
                                color: '#333'
                            },
                            ticks: {
                                // @ts-ignore
                                rotation: -45,
                                autoSkip: true,
                                maxTicksLimit: 10
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Porcentaje del valor máximo (%)',
                                color: '#333'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            max: 100
                        }
                    }
                }
            });
        }
    </script>

    <div class="integration-container">
        <h1>🏅 Atletas Olímpicos vs 🚀 Lanzamientos SpaceX</h1>
        <p class="subtitle">Evolución histórica de atletas olímpicos y lanzamientos espaciales (2000-2024)</p>
        
        <div class="info-api">
            <p><strong>API 1 (propia):</strong> Olympics Athlete Events</p>
            <p><strong>API 2 (externa):</strong> SpaceX API - <code>https://api.spacexdata.com/v4/launches</code></p>
            <p><strong>Biblioteca:</strong> Chart.js | <strong>Tipo:</strong> Area (línea con área rellena)</p>
            <p><strong>API Key:</strong> ❌ No necesaria | ✅ Gratuita</p>
        </div>
        
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Cargando datos históricos...</p>
        </div>
        
        {#if error}
            <div class="error">
                <p>❌ Error: {error}</p>
            </div>
        {/if}
        
        <canvas id="area-chart" style="max-height: 500px; width: 100%;"></canvas>
        
        <div class="table-container">
            <h3>📋 Datos por año</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Año</th>
                            <th>Atletas Olímpicos</th>
                            <th>Lanzamientos SpaceX</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as item}
                            <tr class="{item.launches > 0 ? 'has-launches' : ''}">
                                <td><strong>{item.year}</strong></td>
                                <td>{item.athletes.toLocaleString()}</td>
                                <td class="{item.launches > 0 ? 'launches-value' : ''}">
                                    {item.launches > 0 ? item.launches.toLocaleString() : '-'}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <p class="table-info">Total de años analizados: {combinedData.length} | Datos de SpaceX desde 2006</p>
        </div>
        
        <div class="info">
            <h3>📖 Interpretación</h3>
            <ul>
                <li><strong>Tipo de gráfico:</strong> Área (line con fill) con <strong>Chart.js</strong></li>
                <li><strong>Eje X:</strong> Años (2000-2024)</li>
                <li><strong>Eje Y:</strong> Porcentaje del valor máximo (%)</li>
                <li><strong>Atletas (azul):</strong> Evolución del número de atletas olímpicos</li>
                <li><strong>SpaceX (naranja):</strong> Evolución del número de lanzamientos espaciales</li>
                <li><strong>Área rellena:</strong> Ayuda a visualizar la magnitud de los cambios</li>
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
        
        h1 { color: #0369a1; text-align: center; margin-bottom: 0.5rem; }
        .subtitle { text-align: center; color: #666; margin-bottom: 1rem; }
        
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
            top: 0; left: 0; right: 0; bottom: 0;
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
        
        .table-container h3 { color: #0369a1; margin-bottom: 1rem; }
        .table-wrapper { overflow-x: auto; max-height: 400px; overflow-y: auto; }
        
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
        
        tr:hover { background: #f0f9ff; }
        .has-launches { background: #fef3c7; }
        .launches-value { font-weight: bold; color: #f97316; }
        .table-info { margin-top: 1rem; font-size: 0.85rem; color: #666; text-align: right; }
        
        .info {
            margin-top: 2rem;
            padding: 1rem;
            background: #f0f9ff;
            border-radius: 12px;
            border: 1px solid #bae6fd;
        }
        
        .info h3 { color: #0369a1; margin-top: 0; }
        .info ul { margin: 0; padding-left: 1.5rem; }
        .info li { margin: 0.5rem 0; color: #333; }
    </style>    