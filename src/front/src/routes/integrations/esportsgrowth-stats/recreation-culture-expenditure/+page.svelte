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
            
            try {
                const loadRes = await fetch('https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure/loadInitialData');
            } catch (e) {
                console.log('loadInitialData error (ignorar):', e.message);
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
            
            // 2. Obtener datos de la compañera
            const recRes = await fetch('https://sos2526-24.onrender.com/api/v2/recreation-culture-expenditure');
            const recData = await recRes.json();
            
            // Detectar nombre de la columna dinámicamente
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
                        expenditure: item[nKey] || 0
                    };
                }
            });
            
            // 3. UNIÓN COMPLETA: Con que esté en UNA de las dos APIs, nos vale.
            // Recopilamos todos los nombres en minúsculas para no repetir
            const allCountries = new Set([
                ...Object.keys(playersByCountry).map(c => c.toLowerCase().trim()),
                ...Object.keys(recByCountry).map(c => c.toLowerCase().trim())
            ]);

            combinedData = Array.from(allCountries).map(norm => {
                // Recuperar el nombre original buscando en ambas listas
                const myOriginal = Object.keys(playersByCountry).find(c => c.toLowerCase().trim() === norm);
                const theirOriginal = Object.keys(recByCountry).find(c => c.toLowerCase().trim() === norm);

                return {
                    country: myOriginal || theirOriginal, // Usamos el nombre original que encontremos
                    // @ts-ignore
                    players: myOriginal ? playersByCountry[myOriginal] : 0,
                    // @ts-ignore
                    expenditure: theirOriginal ? recByCountry[theirOriginal].expenditure : 0
                };
            })
            // Ordenamos para que salgan primero los que tienen más jugadores
            .sort((a, b) => b.players - a.players); 
            
            loading = false;
            
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
    
    // USAMOS ECHARTS CON BARRAS Y SCROLL INFERIOR PARA GESTIONAR TANTOS PAÍSES
    function initChart() {
        if (combinedData.length === 0 || chartInitialized) return;
        
        const container = document.getElementById('chart-container');
        if (!container) return;
        
        // @ts-ignore
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
                top: 0
            },
            // Dejamos un margen abajo para la barra de scroll
            grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
            
            // Añadimos el slider para poder navegar por todos los países
            dataZoom: [
                {
                    type: 'slider',
                    show: true,
                    xAxisIndex: [0],
                    start: 0,
                    end: 15 // Muestra el 15% inicial para que se vea claro
                },
                {
                    type: 'inside',
                    xAxisIndex: [0],
                    start: 0,
                    end: 15
                }
            ],
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
                    type: 'bar',
                    data: playersData,
                    yAxisIndex: 0,
                    itemStyle: { color: '#7e22ce', borderRadius: [4, 4, 0, 0] }
                },
                {
                    name: `Gasto (${expColumnName})`,
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
    <h1>🎮 eSports vs 🎭 Gasto en Cultura</h1>
    <p class="subtitle">Relación por país (Mostrando todos los registros disponibles)</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> eSports Growth Stats</p>
        <p><strong>API 2 (compañera):</strong> Recreation & Culture Expenditure</p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Agrupando todos los países...</p>
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
        <div id="chart-container" style="height: 550px; width: 100%; margin-bottom: 1rem; display: {combinedData.length > 0 ? 'block' : 'none'};"></div>
    {/if}
</div>

<style>
    .integration-container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); position: relative; min-height: 600px; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1rem; }
    .info-api { background: #faf5ff; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.85rem; border-left: 4px solid #7e22ce; display: flex; justify-content: space-around;}
    .loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.95); display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 16px; z-index: 100; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #7e22ce; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error { text-align: center; padding: 2rem; margin-top: 1rem; color: #dc2626; background: #fee2e2; border-radius: 8px; }
</style>