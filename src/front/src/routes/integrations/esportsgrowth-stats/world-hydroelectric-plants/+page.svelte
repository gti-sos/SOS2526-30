<script>
    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    // @ts-ignore
    let combinedData = $state([]);
    let chartInitialized = false;
    
    onMount(() => {
        fetchCombinedData();
    });
    
    async function fetchCombinedData() {
        try {
            loading = true;
            
            // 0. Intentar cargar datos iniciales del compañero
            try {
                const loadRes = await fetch('https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants/loadInitialData');
                if (!loadRes.ok) {
                    console.log('loadInitialData responded with status:', loadRes.status);
                }
            } catch (e) {
                // @ts-ignore
                console.log('loadInitialData error:', e.message);
            }
            
            // 1. Obtener tus datos: eSports Growth
            const esportsRes = await fetch('/api/v1/esportsgrowth-stats?limit=1000');
            const esportsData = await esportsRes.json();
            
            const playersByCountry = {};
            // @ts-ignore
            esportsData.forEach(stat => {
                const country = stat.country;
                if (country) {
                    // @ts-ignore
                    playersByCountry[country] = (playersByCountry[country] || 0) + (stat.active_player_no || 0);
                }
            });
            
            // 2. Obtener datos del compañero: Hydroelectric Plants
            const hydroRes = await fetch('https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants');
            const hydroData = await hydroRes.json();
            
            // 3. Combinar datos por país
            const hydroByCountry = {};
            // @ts-ignore
            hydroData.forEach(item => {
                const country = item.country;
                // @ts-ignore
                if (country && !hydroByCountry[country]) {
                    // @ts-ignore
                    hydroByCountry[country] = {
                        capacity: item.capacity_mw,
                        generation: item.generation_gwh,
                        plants: item.number_of_plants,
                        year: item.year
                    };
                }
            });
            
            // 4. Preparar datos combinados
            combinedData = Object.keys(playersByCountry)
                // @ts-ignore
                .filter(country => hydroByCountry[country])
                .map(country => ({
                    country: country,
                    // @ts-ignore
                    players: playersByCountry[country] || 0,
                    // @ts-ignore
                    capacity: hydroByCountry[country].capacity || 0,
                    // @ts-ignore
                    generation: hydroByCountry[country].generation || 0,
                    // @ts-ignore
                    plants: hydroByCountry[country].plants || 0,
                    // @ts-ignore
                    year: hydroByCountry[country].year
                }))
                .sort((a, b) => b.players - a.players)
                .slice(0, 10); 
            
            loading = false;
            
            setTimeout(() => {
                initChart();
            }, 300);
            
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
    
    // USAMOS ECHARTS PERO TIPO SCATTER (DISPERSIÓN) PARA NO REPETIR BARRAS
    function initChart() {
        if (combinedData.length === 0 || chartInitialized) return;
        
        const container = document.getElementById('chart-container');
        if (!container) return;
        
        // @ts-ignore
        const chart = window.echarts.init(container);
        
        // Formato para scatter: [ejeX, ejeY, nombre_pais]
        const scatterData = combinedData.map(d => [d.players, d.capacity, d.country]);
        
        const option = {
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    return `<strong>${params.data[2]}</strong><br/>Jugadores eSports: ${params.data[0].toLocaleString()} M<br/>Capacidad Hidro: ${params.data[1].toLocaleString()} MW`;
                }
            },
            grid: { left: '8%', right: '10%', bottom: '15%', containLabel: true },
            xAxis: {
                type: 'value',
                name: 'Jugadores Activos (M)',
                nameLocation: 'middle',
                nameGap: 30,
                splitLine: { lineStyle: { type: 'dashed' } }
            },
            yAxis: {
                type: 'value',
                name: 'Capacidad Hidroeléctrica (MW)',
                nameLocation: 'middle',
                nameGap: 50,
                splitLine: { lineStyle: { type: 'dashed' } }
            },
            series: [{
                name: 'Países',
                type: 'scatter',
                symbolSize: 22, // Tamaño de las bolas
                itemStyle: {
                    color: '#3b82f6',
                    opacity: 0.8,
                    borderColor: '#1d4ed8',
                    borderWidth: 2
                },
                data: scatterData
            }]
        };
        
        chart.setOption(option);
        chartInitialized = true;
    }
</script>

<svelte:head>
    <title>API Grupo 27 - Integraciones</title>
    <!-- Mantenemos ECharts por CDN igual que en la otra -->
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
</svelte:head>

<div class="integration-container">
    <h1>🎮 eSports vs ⚡ Capacidad Hidroeléctrica</h1>
    <p class="subtitle">Relación entre jugadores activos y capacidad hidroeléctrica (datos combinados)</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> eSports Growth Stats - Jugadores activos por país</p>
        <p><strong>API 2 (compañero):</strong> World Hydroelectric Plants - Capacidad instalada por país</p>
        <p><strong>Fuente:</strong> Grupo 27 - SOS</p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando datos combinados...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {:else}
        <div id="chart-container" style="height: 550px; width: 100%; margin-bottom: 2rem;"></div>
        
        <div class="table-container">
            <h3>📋 Datos combinados</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>País</th>
                            <th>Jugadores eSports (M)</th>
                            <th>Capacidad Hidroeléctrica (MW)</th>
                            <th>Generación (GWh)</th>
                            <th>Nº Plantas</th>
                            <th>Año dato</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as item}
                            <tr>
                                <td><strong>{item.country}</strong></td>
                                <td>{item.players.toLocaleString()}</td>
                                <td>{item.capacity.toLocaleString()} MW</td>
                                <td>{item.generation.toLocaleString()} GWh</td>
                                <td>{item.plants}</td>
                                <td>{item.year}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
    
    <div class="info">
        <h3>📖 Interpretación</h3>
        <ul>
            <li><strong>Objetivo:</strong> Comparar el volumen de jugadores de eSports con la infraestructura hidroeléctrica por país.</li>
            <li><strong>Gráfico:</strong> Dispersión (scatter) usando la librería <strong>Apache ECharts</strong>.</li>
            <li><strong>Relación:</strong> Permite ver en un plano XY dónde se sitúan los países (a más arriba, más capacidad hidroeléctrica; a más a la derecha, más jugadores).</li>
        </ul>
    </div>
</div>

<style>
    .integration-container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); position: relative; min-height: 600px; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1rem; }
    .info-api { background: #faf5ff; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.85rem; border-left: 4px solid #7e22ce; }
    .loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.95); display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 16px; z-index: 100; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #7e22ce; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error { text-align: center; padding: 2rem; margin-top: 1rem; color: #dc2626; background: #fee2e2; border-radius: 8px; }
    .table-container { margin-top: 2rem; border-top: 1px solid #e2e8f0; padding-top: 1rem; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #faf5ff; font-weight: 600; color: #7e22ce; }
    tr:hover { background: #faf5ff; }
    .info { margin-top: 2rem; padding: 1rem; background: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff; }
    .info h3 { color: #7e22ce; margin-top: 0; }
</style>