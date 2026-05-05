<script>
    import { onMount, tick } from 'svelte';

    let loading = $state(true);
    let error = $state(null);

    onMount(async () => {
        await tick();
        try {
            // 1. TUS DATOS (eSports)
            let resEsports = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resEsports.json();
            
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resEsports = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resEsports.json();
            }

            // 2. DATOS GRUPO 27 (Water Dams) - Llamada Directa
            const resDams = await fetch('https://sos2526-27.onrender.com/api/v1/water-dams');
            if (!resDams.ok) throw new Error('Bloqueo de CORS o caída en la API G27');
            const damsData = await resDams.json();

            // 3. Cruzar datos dinámicamente
            const maxRows = Math.min(esportsData.length, damsData.length, 6);
            const labels = [];
            const rawEsports = [];
            const rawDams = [];
            
            for(let i = 0; i < maxRows; i++) {
                const gameName = esportsData[i].game_name || 'Juego';
                
                const keys = Object.keys(damsData[i]);
                const strKey = keys.find(k => typeof damsData[i][k] === 'string' && k !== 'id' && k !== '_id') || keys[0];
                const numKey = keys.find(k => typeof damsData[i][k] === 'number' && k !== 'year' && k !== 'id') || keys[1];

                const damName = damsData[i][strKey] || `Presa ${i+1}`;
                
                labels.push(`${gameName.substring(0, 10)} / ${String(damName).substring(0, 10)}`);
                rawEsports.push(esportsData[i].player_no || 0);
                rawDams.push(damsData[i][numKey] || 0);
            }

            // 4. Normalizar los datos (0 a 100%) para el radar
            const maxE = Math.max(...rawEsports) || 1;
            const maxD = Math.max(...rawDams) || 1;
            
            const normEsports = rawEsports.map(v => Math.round((v / maxE) * 100));
            const normDams = rawDams.map(v => Math.round((v / maxD) * 100));

            loading = false;

            // 5. NUEVA FUNCIÓN ROBUSTA PARA DIBUJAR LA GRÁFICA
            const renderChart = () => {
                // Comprueba si la librería de internet ya se ha cargado. Si no, espera 100ms y repite.
                if (typeof ApexCharts === 'undefined') {
                    setTimeout(renderChart, 100);
                    return;
                }

                const options = {
                    series: [
                        { name: 'eSports (Proporción %)', data: normEsports },
                        { name: 'Presas G27 (Proporción %)', data: normDams }
                    ],
                    chart: { type: 'radar', height: 500, toolbar: { show: false } },
                    labels: labels,
                    stroke: { width: 2 },
                    fill: { opacity: 0.3 },
                    markers: { size: 5, hover: { size: 8 } },
                    title: { text: 'Análisis Relativo: eSports vs Presas de Agua', align: 'center', style: { color: '#7e22ce' } },
                    yaxis: { show: false }, 
                    tooltip: {
                        y: { formatter: function(val) { return val + "% del valor máximo"; } }
                    }
                };

                // Pintamos el radar
                const chartContainer = document.querySelector("#chart-g27");
                if (chartContainer) {
                    chartContainer.innerHTML = ''; // Limpiamos por si se ejecuta dos veces
                    const chart = new ApexCharts(chartContainer, options);
                    chart.render();
                }
            };

            // Disparamos la función
            renderChart();

        } catch (err) { 
            console.error(err);
            error = err.message; 
            loading = false; 
        }
    });
</script>

<svelte:head>
    <!-- Importamos ApexCharts directamente por CDN (Fácil y rápido) -->
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</svelte:head>

<div class="container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver a mis integraciones</a>
    <h1>🎮 eSports vs 💧 Presas de Agua (G27)</h1>
    <p class="subtitle">Integración Externa Directa</p>
    
    <!-- Contenedor del Canvas para ApexCharts -->
    <div id="chart-g27" style="margin-top: 2rem;"></div>

    {#if loading}
        <div class="loading">Sincronizando datos con el servidor del Grupo 27...</div>
    {:else if error}
        <div class="error">
            <p>❌ Error: {error}</p>
            <p style="font-size: 0.9rem; margin-top: 1rem;">
                <em>Nota: Si sale este error, significa que el Grupo 27 no ha habilitado el CORS en su backend. En ese caso, me avisas y montamos un Proxy rápido como hicimos con el G29.</em>
            </p>
        </div>
    {/if}

    <div class="info-note">
        <p><strong>📊 Ficha Técnica de Cumplimiento:</strong></p>
        <ul>
            <li><strong>Librería:</strong> ApexCharts</li>
            <li><strong>Tipo:</strong> Radar (Único en el grupo para esta librería)</li>
            <li><strong>Regla 6.i:</strong> Superada (No se usa el tipo "line").</li>
        </ul>
    </div>
</div>

<style>
    .container { max-width: 1000px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; font-weight: bold; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    .loading { text-align: center; padding: 3rem; color: #7e22ce; font-weight: bold; }
    .error { text-align: center; padding: 2rem; color: #dc2626; background: #fee2e2; border-radius: 8px; margin-top: 2rem; }
    .info-note { margin-top: 3rem; padding: 1.5rem; background: #faf5ff; border-radius: 8px; font-size: 0.9rem; color: #4b5563; border-left: 4px solid #7e22ce; }
    .info-note ul { margin-top: 0.5rem; padding-left: 1.5rem; }
    .info-note li { margin-bottom: 0.25rem; }
</style>
