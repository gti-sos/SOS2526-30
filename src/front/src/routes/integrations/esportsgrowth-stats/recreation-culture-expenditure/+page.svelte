<script>
    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    // @ts-ignore
    let combinedData = $state([]);
    let chartInitialized = false;
    let expColumnName = "Gasto";
    
    onMount(() => {
        fetchCombinedData();
    });
    
    async function fetchCombinedData() {
        try {
            loading = true;
            
            // 0. Intentar cargar datos iniciales del compañero
            try {
                const loadRes = await fetch('https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure/loadInitialData');
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
            
            // 2. Obtener datos del compañero
            const recRes = await fetch('https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure');
            const recData = await recRes.json();
            
            // Detectar nombre de la columna
            let nKey = 'value';
            if (recData && recData.length > 0) {
                nKey = Object.keys(recData[0]).find(k => typeof recData[0][k] === 'number' && k !== 'year' && k !== 'id') || Object.keys(recData[0])[1];
                expColumnName = nKey;
            }

            const recByCountry = {};
            // @ts-ignore
            recData.forEach(item => {
                const country = item.country || item.territory || item.name; 
                if (country && !recByCountry[country]) {
                    recByCountry[country] = {
                        expenditure: item[nKey] || 0,
                        year: item.year || 'N/A'
                    };
                }
            });
            
            // 4. Combinar y ordenar
            combinedData = Object.keys(playersByCountry)
                // @ts-ignore
                .filter(country => recByCountry[country])
                .map(country => ({
                    country: country,
                    // @ts-ignore
                    players: playersByCountry[country] || 0,
                    // @ts-ignore
                    expenditure: recByCountry[country].expenditure || 0,
                    // @ts-ignore
                    year: recByCountry[country].year
                }))
                .sort((a, b) => b.players - a.players)
                .slice(0, 10);
            
            loading = false;
            
            // Damos margen para que el div se renderice antes de inyectar ECharts
            setTimeout(() => {
                initChart();
            }, 500);
            
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
    
    // AQUÍ ESTÁ EL CAMBIO: Usamos Apache ECharts en lugar de Highcharts
    function initChart() {
        if (combinedData.length === 0 || chartInitialized) return;
        
        const container = document.getElementById('chart-container');
        if (!container) return;
        
        // @ts-ignore - Inicializamos ECharts
        const chart = window.echarts.init(container);
        
        const categories = combinedData.map(d => d.country);
        const playersData = combinedData.map(d => d.players);
        const expenditureData = combinedData.map(d => d.expenditure);
        
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                data: ['Jugadores Activos', `Gasto (${expColumnName})`],
                bottom: 0
            },
            grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
            xAxis: {
                type: 'category',
                data: categories,
                axisLabel: { interval: 0, rotate: 30 }
            },
            yAxis: [
                {
                    type: 'value',
                    name: 'Jugadores (M)',
                    position: 'left',
                    axisLine: { show: true, lineStyle: { color: '#7e22ce' } }
                },
                {
                    type: 'value',
                    name: `Gasto`,
                    position: 'right',
                    axisLine: { show: true, lineStyle: { color: '#10b981' } },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: 'Jugadores Activos',
                    type: 'bar', // Tipo bar de ECharts (¡Legal!)
                    data: playersData,
                    yAxisIndex: 0,
                    itemStyle: { color: '#7e22ce', borderRadius: [4, 4, 0, 0] }
                },
                {
                    name: `Gasto (${expColumnName})`,
                    type: 'bar', // Tipo bar de ECharts (¡Legal!)
                    data: expenditureData,
                    yAxisIndex: 1,
                    itemStyle: { color: '#10b981', borderRadius: [4, 4, 0, 0] }
                }
            ]
        };
        
        chart.setOption(option);
        chartInitialized = true;
    }
</script>

<svelte:head>
    <!-- Importamos Apache ECharts por CDN para evitar dependencias -->
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
</svelte:head>

<div class="integration-container">
    <h1>🎮 eSports vs 🎭 Gasto en Cultura y Recreación</h1>
    <p class="subtitle">Relación entre volumen de jugadores y gasto cultural por país (datos combinados)</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> eSports Growth Stats - Jugadores activos por país</p>
        <p><strong>API 2 (compañero):</strong> Recreation & Culture Expenditure - Gasto por país</p>
        <p><strong>Fuente:</strong> Grupo 24 - SOS</p>
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
        <div id="chart-container" style="height: 500px; width: 100%; margin-bottom: 2rem;"></div>
        
        <div class="table-container">
            <h3>📋 Datos combinados</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>País</th>
                            <th>Jugadores eSports (M)</th>
                            <th>Gasto Cultura / Recreación</th>
                            <th>Año dato (Grupo 24)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as item}
                            <tr>
                                <td><strong>{item.country}</strong></td>
                                <td>{item.players.toLocaleString()}</td>
                                <td>{item.expenditure.toLocaleString()}</td>
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
            <li><strong>Objetivo:</strong> Relacionar el crecimiento de jugadores de eSports con la inversión en recreación y cultura de los países.</li>
            <li><strong>Gráfico:</strong> Barras dobles (bar) con <strong>Apache ECharts</strong> (¡Nueva combinación!).</li>
            <li><strong>Relación:</strong> Permite visualizar si los países con mayor gasto tradicional también lideran en deportes electrónicos.</li>
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