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
            } catch (e) {
                console.log('loadInitialData error (ignorar):', e.message);
            }
            
            // 1. Obtener tus datos: eSports Growth
            const esportsRes = await fetch('/api/v1/esportsgrowth-stats?limit=1000');
            const esportsData = await esportsRes.json();
            
            // AGRUPAR POR AÑO (Sumando jugadores)
            const playersByYear = {};
            // @ts-ignore
            esportsData.forEach(stat => {
                const year = stat.year;
                if (year) {
                    // @ts-ignore
                    playersByYear[year] = (playersByYear[year] || 0) + (stat.active_player_no || 0);
                }
            });
            
            // 2. Obtener datos del compañero
            const recRes = await fetch('https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure');
            const recData = await recRes.json();
            
            // Detectar nombre de la columna de gasto dinámicamente
            let nKey = 'value';
            if (recData && recData.length > 0) {
                nKey = Object.keys(recData[0]).find(k => typeof recData[0][k] === 'number' && k !== 'year' && k !== 'id') || Object.keys(recData[0])[1];
                expColumnName = nKey;
            }

            // AGRUPAR POR AÑO (Sumando el gasto)
            const recByYear = {};
            // @ts-ignore
            recData.forEach(item => {
                const year = item.year;
                if (year) {
                    // @ts-ignore
                    recByYear[year] = (recByYear[year] || 0) + (item[nKey] || 0);
                }
            });
            
            // 3. UNIÓN COMPLETA: Coger todos los años de ambas APIs
            let uniqueYears = Array.from(new Set([...Object.keys(playersByYear), ...Object.keys(recByYear)]))
                .map(Number)
                .sort((a, b) => a - b); // Ordenar de menor a mayor

            if (uniqueYears.length > 0) {
                let maxYear = uniqueYears[uniqueYears.length - 1];
                let minYear = uniqueYears[0];
                
                // 4. GARANTIZAR AL MENOS 10 AÑOS EN LA GRÁFICA
                if (maxYear - minYear < 9) {
                    minYear = maxYear - 9; // Forzamos 10 años en el eje
                }

                // Generamos la lista de años continuada
                let fullYearsRange = [];
                for (let y = minYear; y <= maxYear; y++) {
                    fullYearsRange.push(y.toString());
                }

                // 5. Mapear los datos, poniendo 0 si alguna API no tiene datos ese año
                combinedData = fullYearsRange.map(year => ({
                    year: year,
                    // @ts-ignore
                    players: playersByYear[year] || 0,
                    // @ts-ignore
                    expenditure: recByYear[year] || 0
                }));
            } else {
                combinedData = [];
            }
            
            loading = false;
            
            // Damos un pequeño margen para que el div se renderice
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
    
    // USAMOS APACHE ECHARTS TIPO "BAR"
    function initChart() {
        if (combinedData.length === 0 || chartInitialized) return;
        
        const container = document.getElementById('chart-container');
        if (!container) return;
        
        // @ts-ignore
        const chart = window.echarts.init(container);
        
        const categories = combinedData.map(d => d.year);
        const playersData = combinedData.map(d => d.players);
        const expenditureData = combinedData.map(d => d.expenditure);
        
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' }
            },
            legend: {
                data: ['Total Jugadores eSports', `Gasto Mundial (${expColumnName})`],
                bottom: 0
            },
            grid: { left: '5%', right: '5%', bottom: '15%', containLabel: true },
            xAxis: {
                type: 'category',
                data: categories,
                axisLabel: { interval: 0, rotate: 45 }
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
                    name: 'Total Jugadores eSports',
                    type: 'bar',
                    data: playersData,
                    yAxisIndex: 0,
                    itemStyle: { color: '#7e22ce', borderRadius: [4, 4, 0, 0] }
                },
                {
                    name: `Gasto Mundial (${expColumnName})`,
                    type: 'bar',
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
    <title>API Grupo 24 - Integraciones</title>
    <!-- Importamos Apache ECharts por CDN -->
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
</svelte:head>

<div class="integration-container">
    <h1>🎮 eSports vs 🎭 Gasto en Cultura y Recreación</h1>
    <p class="subtitle">Evolución global a 10 años: Volumen de jugadores vs Gasto cultural (Total Mundial)</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> eSports Growth Stats - Agrupado por Año</p>
        <p><strong>API 2 (compañero):</strong> Recreation & Culture Expenditure - Agrupado por Año</p>
        <p><strong>Fuente:</strong> Grupo 24 - SOS</p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Procesando y cruzando años...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {:else}
        {#if combinedData.length === 0 && !loading}
            <div class="error" style="background: #fffbeb; color: #d97706;">
                <p>⚠️ No hay datos disponibles para mostrar la gráfica.</p>
            </div>
        {/if}
        <div id="chart-container" style="height: 500px; width: 100%; margin-bottom: 2rem; display: {combinedData.length > 0 ? 'block' : 'none'};"></div>
        
        {#if combinedData.length > 0}
        <div class="table-container">
            <h3>📋 Totales Globales por Año</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Año</th>
                            <th>Total Jugadores eSports (M)</th>
                            <th>Gasto Cultura / Recreación Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as item}
                            <tr>
                                <td><strong>{item.year}</strong></td>
                                <td>
                                    {#if item.players === 0}
                                        <span class="no-data">-</span>
                                    {:else}
                                        {item.players.toLocaleString()}
                                    {/if}
                                </td>
                                <td>
                                    {#if item.expenditure === 0}
                                        <span class="no-data">-</span>
                                    {:else}
                                        {item.expenditure.toLocaleString()}
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
        {/if}
    {/if}
    
    <div class="info">
        <h3>📖 Interpretación</h3>
        <ul>
            <li><strong>Objetivo:</strong> Relacionar la evolución histórica del volumen de jugadores de eSports con la inversión global en recreación y cultura.</li>
            <li><strong>Gráfico:</strong> Barras evolutivas (bar) usando <strong>Apache ECharts</strong>.</li>
            <li><strong>Manejo de Datos:</strong> Se garantizan al menos 10 años en el eje temporal, sumando los valores mundiales y rellenando con guiones (-) cuando la información de ese año no existe.</li>
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
    th, td { padding: 0.75rem; text-align: center; border-bottom: 1px solid #e2e8f0; }
    th { background: #faf5ff; font-weight: 600; color: #7e22ce; text-align: center; }
    tr:hover { background: #faf5ff; }
    .no-data { color: #94a3b8; font-style: italic; }
    .info { margin-top: 2rem; padding: 1rem; background: #faf5ff; border-radius: 12px; border: 1px solid #e9d5ff; }
    .info h3 { color: #7e22ce; margin-top: 0; }
</style>