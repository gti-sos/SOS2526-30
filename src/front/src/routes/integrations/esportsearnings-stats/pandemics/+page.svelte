<script>
    import { onMount, tick } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    let chartInitialized = false;
    
    let chartLabels = $state([]);
    let esportsSeries = $state([]);
    let pandemicsSeries = $state([]);
    let chartElement; // Enlace para Svelte 5
    
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

            // Saneamiento
            if (!Array.isArray(pandemicsData)) {
                pandemicsData = pandemicsData.data || Object.values(pandemicsData)[0] || [];
            }

            // Si está vacía, llamamos a su loadInitialData
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
            
            // 3. Cruzar datos dinámicamente
            const maxRows = Math.max(0, Math.min(esportsData.length, pandemicsData.length, 8));
            if (maxRows === 0) throw new Error('No hay datos suficientes para generar la gráfica.');

            const rawEsports = [];
            const rawPandemics = [];
            const tempLabels = [];
            let pandemicDataName = "Afectados";
            
            for(let i = 0; i < maxRows; i++) {
                const gameName = esportsData[i]?.game_name || 'Juego';
                
                // Buscamos dinámicamente el nombre de la pandemia y su valor (muertes, casos...)
                const keys = Object.keys(pandemicsData[i] || {});
                const strKey = keys.find(k => typeof pandemicsData[i][k] === 'string' && k !== 'id' && k !== '_id' && k !== 'country') || keys[0];
                const numKey = keys.find(k => typeof pandemicsData[i][k] === 'number' && k !== 'year' && k !== 'id') || keys[1];

                if (i === 0 && numKey) {
                    pandemicDataName = numKey.charAt(0).toUpperCase() + numKey.slice(1); // Para la leyenda
                }

                const pandemicName = pandemicsData[i][strKey] || `Pandemia ${i+1}`;
                
                tempLabels.push(`${gameName.substring(0, 15)} / ${String(pandemicName).substring(0, 15)}`);
                rawEsports.push(Number(esportsData[i]?.player_no) || 0);
                rawPandemics.push(Number(pandemicsData[i]?.[numKey]) || 0);
            }
            
            // 4. Normalizar (0 a 100%) para poder comparar barras justamente
            const maxE = Math.max(...rawEsports, 1);
            const maxP = Math.max(...rawPandemics, 1);
            
            esportsSeries = rawEsports.map(v => Math.round((v / maxE) * 100) || 0);
            pandemicsSeries = rawPandemics.map(v => Math.round((v / maxP) * 100) || 0);
            chartLabels = tempLabels;
            
            loading = false;
            await tick(); // Aseguramos que Svelte pinta el div
            
            setTimeout(() => {
                initChart(pandemicDataName);
            }, 300);
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
        }
    }
    
    function initChart(pandemicName) {
        if (chartInitialized) return;
        
        if (typeof window === 'undefined' || !window.ApexCharts) {
            setTimeout(() => initChart(pandemicName), 100);
            return;
        }
        
        if (!chartElement) return;
        
        const options = {
            series: [{
                name: 'eSports: Jugadores (%)',
                data: esportsSeries
            }, {
                name: `Pandemias: ${pandemicName} (%)`,
                data: pandemicsSeries
            }],
            chart: {
                type: 'bar', // Tipo de gráfica blindado
                height: 500,
                toolbar: { show: false }
            },
            plotOptions: {
                bar: {
                    horizontal: true, // ¡BARRAS HORIZONTALES! Súper elegantes
                    dataLabels: { position: 'top' },
                    borderRadius: 4
                }
            },
            colors: ['#a855f7', '#ef4444'], // Morado para juegos, Rojo para pandemias
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
    <p class="subtitle">Análisis Relativo: Nº Jugadores vs Víctimas (Barras Horizontales)</p>
    
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
        <!-- Contenedor blindado para Svelte -->
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