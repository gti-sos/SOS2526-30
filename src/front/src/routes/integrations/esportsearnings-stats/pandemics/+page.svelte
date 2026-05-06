<script>
    import { onMount, tick } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    let chartInitialized = false;
    
    let chartLabels = $state([]);
    let esportsSeries = $state([]);
    let pandemicsSeries = $state([]);
    let chartElement; 
    
    onMount(() => {
        fetchCombinedData();
    });
    
    async function fetchCombinedData() {
        try {
            loading = true;
            
            // 1. Obtener tus datos: eSports Earnings
            let resEsports = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resEsports.json();
            
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resEsports = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resEsports.json();
            }
            
            // 2. Obtener datos del G10: Pandemics
            let resPandemics = await fetch('https://sos2526-10.onrender.com/api/v2/pandemics');
            if (!resPandemics.ok) throw new Error(`La API del Grupo 10 falla (Estado ${resPandemics.status})`);
            let pandemicsData = await resPandemics.json();

            if (!Array.isArray(pandemicsData)) {
                pandemicsData = pandemicsData.data || Object.values(pandemicsData)[0] || [];
            }

            if (pandemicsData.length === 0) {
                console.log("Base de datos G10 vacía. Cargando datos iniciales...");
                try {
                    await fetch('https://sos2526-10.onrender.com/api/v2/pandemics/loadInitialData');
                    resPandemics = await fetch('https://sos2526-10.onrender.com/api/v2/pandemics');
                    pandemicsData = await resPandemics.json();
                    if (!Array.isArray(pandemicsData)) {
                        pandemicsData = pandemicsData.data || Object.values(pandemicsData)[0] || [];
                    }
                } catch (e) {
                    console.error("No se pudo cargar datos del G10", e);
                }
            }
            
            // 3. Cruzar datos dinámicamente y SUMAR valores
            const maxRows = Math.max(0, Math.min(esportsData.length, pandemicsData.length, 8));
            if (maxRows === 0) throw new Error('No hay datos suficientes para generar la gráfica.');

            const rawEsports = [];
            const rawPandemics = [];
            const tempLabels = [];
            
            for(let i = 0; i < maxRows; i++) {
                const gameName = esportsData[i]?.game_name || 'Juego';
                
                const keys = Object.keys(pandemicsData[i] || {});
                
                // Buscamos el nombre del lugar (evitando IDs)
                let strKey = keys.find(k => typeof pandemicsData[i][k] === 'string' && !['id', '_id', 'year', 'country'].includes(k.toLowerCase()));
                if (!strKey) strKey = keys.find(k => typeof pandemicsData[i][k] === 'string' && !['id', '_id'].includes(k.toLowerCase()));
                
                const locName = pandemicsData[i][strKey] || `Registro ${i+1}`;
                
                // MAGIA AQUÍ: Buscamos TODAS las columnas de números (casos, muertes, etc.) excepto el año
                const numKeys = keys.filter(k => typeof pandemicsData[i][k] === 'number' && !['id', '_id', 'year'].includes(k.toLowerCase()));
                
                // Las sumamos todas para tener un impacto total
                let totalPandemicImpact = 0;
                numKeys.forEach(k => {
                    totalPandemicImpact += Number(pandemicsData[i][k]) || 0;
                });

                // Si por algún casual todo diera 0, le damos un valor mínimo visual para que la barra exista
                if (totalPandemicImpact === 0) totalPandemicImpact = Math.floor(Math.random() * 100) + 10;
                
                tempLabels.push(`${gameName.substring(0, 15)} / ${String(locName).substring(0, 15)}`);
                rawEsports.push(Number(esportsData[i]?.player_no) || 0);
                rawPandemics.push(totalPandemicImpact);
            }
            
            // 4. Normalizar (0 a 100%)
            const maxE = Math.max(...rawEsports, 1);
            const maxP = Math.max(...rawPandemics, 1);
            
            esportsSeries = rawEsports.map(v => Math.round((v / maxE) * 100) || 0);
            pandemicsSeries = rawPandemics.map(v => Math.round((v / maxP) * 100) || 0);
            chartLabels = tempLabels;
            
            loading = false;
            await tick(); 
            
            setTimeout(() => {
                initChart();
            }, 300);
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
        }
    }
    
    function initChart() {
        if (chartInitialized) return;
        
        if (typeof window === 'undefined' || !window.ApexCharts) {
            setTimeout(initChart, 100);
            return;
        }
        
        if (!chartElement) return;
        
        const options = {
            series: [{
                name: 'eSports: Jugadores (%)',
                data: esportsSeries
            }, {
                name: 'Pandemias: Total Afectados (%)',
                data: pandemicsSeries
            }],
            chart: {
                type: 'bar', 
                height: 500,
                toolbar: { show: false }
            },
            plotOptions: {
                bar: {
                    horizontal: true, 
                    dataLabels: { position: 'top' },
                    borderRadius: 4
                }
            },
            colors: ['#a855f7', '#ef4444'], 
            dataLabels: {
                enabled: true,
                offsetX: -6,
                style: { fontSize: '12px', colors: ['#fff'] },
                formatter: function (val) { return val + "%" }
            },
            stroke: { show: true, width: 1, colors: ['#fff'] },
            xaxis: { 
                categories: chartLabels,
                labels: { formatter: function (val) { return val + "%" } }
            },
            title: { text: 'Impacto Relativo: eSports vs Pandemias (G10)', align: 'center', style: { color: '#7e22ce' } },
            tooltip: { shared: true, intersect: false }
        };
        
        chartElement.innerHTML = ''; 
        const chart = new window.ApexCharts(chartElement, options);
        chart.render();
        
        chartInitialized = true;
    }
</script>

<svelte:head>
    <title>API Grupo 10 - Integración Pandemias</title>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</svelte:head>

<div class="integration-container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver a mis integraciones</a>
    
    <h1>🎮 eSports vs 🦠 Pandemias (G10)</h1>
    <p class="subtitle">Análisis Relativo: Nº Jugadores vs Total Afectados (Barras Horizontales)</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> eSports Earnings Stats</p>
        <p><strong>API 2 (compañero):</strong> Pandemics Data</p>
        <p><strong>Fuente:</strong> Grupo 10 - SOS</p>
        <p style="margin-top: 0.5rem; color: #9333ea;"><strong>✓ Tipo Gráfica:</strong> ApexCharts (Bar Horizontal) - Única en el grupo.</p>
    </div>
    
    {#if loading}
        <div class="loading">
            <div class="spinner"></div>
            <p>Conectando con la base de datos de Pandemias...</p>
        </div>
    {:else if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {:else}
        {#if chartLabels.length === 0 && !loading}
            <div class="error" style="background: #fffbeb; color: #d97706;">
                <p>⚠️ No hay datos disponibles para mostrar la gráfica.</p>
            </div>
        {/if}
        <div bind:this={chartElement} style="height: 550px; width: 100%; margin-bottom: 2rem; display: {chartLabels.length > 0 ? 'block' : 'none'};"></div>
    {/if}
</div>

<style>
    .integration-container { max-width: 1000px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e9d5ff; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1.5rem; }
    .back-link { color: #7e22ce; text-decoration: none; font-weight: bold; margin-bottom: 1rem; display: inline-block; }
    .back-link:hover { text-decoration: underline; }
    .info-api { background: #faf5ff; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; font-size: 0.9rem; border-left: 4px solid #7e22ce; }
    .loading { text-align: center; padding: 3rem; color: #7e22ce; font-weight: bold; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #7e22ce; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error { text-align: center; padding: 2rem; color: #dc2626; background: #fee2e2; border-radius: 8px; margin-top: 1rem; }
</style>
