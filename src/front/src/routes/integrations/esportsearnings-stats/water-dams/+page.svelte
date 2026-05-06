<script>
    import { onMount, tick } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    let chartInitialized = false;
    
    // ¡LA CLAVE! Ahora tienen $state() para que Svelte actualice la pantalla al llenarse
    let radarLabels = $state([]);
    let esportsSeries = $state([]);
    let damsSeries = $state([]);
    let chartElement; // Enlace directo al HTML
    
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
            
            // 2. Obtener datos del G27: Water Dams
            let resDams = await fetch('https://sos2526-27.onrender.com/api/v1/water-dams');
            if (!resDams.ok) throw new Error(`La API del Grupo 27 falla (Estado ${resDams.status})`);
            let damsData = await resDams.json();

            if (!Array.isArray(damsData)) {
                damsData = damsData.data || Object.values(damsData)[0] || [];
            }

            // Despertamos y rellenamos la BD del compañero si está vacía
            if (damsData.length === 0) {
                console.log("Base de datos G27 vacía. Cargando datos iniciales...");
                try {
                    await fetch('https://sos2526-27.onrender.com/api/v1/water-dams/loadInitialData');
                    resDams = await fetch('https://sos2526-27.onrender.com/api/v1/water-dams');
                    damsData = await resDams.json();
                    if (!Array.isArray(damsData)) {
                        damsData = damsData.data || Object.values(damsData)[0] || [];
                    }
                } catch (e) {
                    console.error("No se pudo cargar datos iniciales del G27", e);
                }
            }
            
            // 3. Cruzar datos (Top 6)
            const maxRows = Math.max(0, Math.min(esportsData.length, damsData.length, 6));
            if (maxRows === 0) throw new Error('No hay datos suficientes para generar la comparativa.');

            const rawEsports = [];
            const rawDams = [];
            const tempLabels = [];
            
            for(let i = 0; i < maxRows; i++) {
                const gameName = esportsData[i]?.game_name || 'Juego';
                
                const keys = Object.keys(damsData[i] || {});
                const strKey = keys.find(k => typeof damsData[i][k] === 'string' && k !== 'id' && k !== '_id') || keys[0];
                const numKey = keys.find(k => typeof damsData[i][k] === 'number' && k !== 'year' && k !== 'id') || keys[1];

                const damName = damsData[i][strKey] || `Presa ${i+1}`;
                
                tempLabels.push(`${gameName.substring(0, 10)} / ${String(damName).substring(0, 10)}`);
                rawEsports.push(Number(esportsData[i]?.player_no) || 0);
                rawDams.push(Number(damsData[i]?.[numKey]) || 0);
            }
            
            // 4. Normalizar (0 a 100%) y asignar a variables de estado
            const maxE = Math.max(...rawEsports, 1);
            const maxD = Math.max(...rawDams, 1);
            
            esportsSeries = rawEsports.map(v => Math.round((v / maxE) * 100) || 0);
            damsSeries = rawDams.map(v => Math.round((v / maxD) * 100) || 0);
            radarLabels = tempLabels;
            
            loading = false;
            await tick(); // Obligamos a Svelte a actualizar el HTML ahora mismo
            
            setTimeout(() => {
                initChart();
            }, 300);
            
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    function initChart() {
        if (chartInitialized) return;
        
        if (typeof window === 'undefined' || !window.ApexCharts) {
            setTimeout(initChart, 100);
            return;
        }
        
        if (!chartElement) return; // Si el div no existe aún, cancelamos
        
        const options = {
            series: [{
                name: 'eSports (Proporción %)',
                data: esportsSeries
            }, {
                name: 'Presas G27 (Proporción %)',
                data: damsSeries
            }],
            chart: {
                height: 500,
                type: 'radar',
                toolbar: { show: false }
            },
            colors: ['#7e22ce', '#3b82f6'],
            labels: radarLabels,
            stroke: { width: 2 },
            fill: { opacity: 0.3 },
            markers: { size: 5, hover: { size: 8 } },
            yaxis: { show: false },
            tooltip: {
                y: { formatter: function(val) { return val + "% del valor máximo"; } }
            }
        };
        
        chartElement.innerHTML = ''; 
        const chart = new window.ApexCharts(chartElement, options);
        chart.render();
        
        chartInitialized = true;
    }
</script>

<svelte:head>
    <title>API Grupo 27 - Integración eSports</title>
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</svelte:head>

<div class="integration-container">
    <a href="/integrations/esportsearnings-stats" style="color: #7e22ce; text-decoration: none; font-weight: bold; margin-bottom: 1rem; display: inline-block;">← Volver a mis integraciones</a>
    
    <h1>🎮 eSports vs 💧 Presas de Agua</h1>
    <p class="subtitle">Análisis Relativo: Nº Jugadores vs Capacidad de Presas (Radar)</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> eSports Earnings Stats</p>
        <p><strong>API 2 (compañero):</strong> Water Dams Data</p>
        <p><strong>Fuente:</strong> Grupo 27 - SOS</p>
        <p style="margin-top: 0.5rem; color: #9333ea;"><strong>✓ Tipo Gráfica:</strong> ApexCharts (Radar) - Única en el grupo.</p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Procesando y cruzando APIs...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {:else}
        {#if radarLabels.length === 0 && !loading}
            <div class="error" style="background: #fffbeb; color: #d97706;">
                <p>⚠️ No hay datos disponibles para mostrar la gráfica.</p>
            </div>
        {/if}
        <!-- ¡NUEVO! Con bind:this vinculamos el div directamente a la variable de JS -->
        <div bind:this={chartElement} style="height: 550px; width: 100%; margin-bottom: 2rem; display: {radarLabels.length > 0 ? 'block' : 'none'};"></div>
    {/if}
</div>

<style>
    .integration-container { max-width: 1000px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); position: relative; min-height: 600px; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1rem; }
    .info-api { background: #faf5ff; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.85rem; border-left: 4px solid #7e22ce; }
    .loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.95); display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 16px; z-index: 100; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #7e22ce; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error { text-align: center; padding: 2rem; margin-top: 1rem; color: #dc2626; background: #fee2e2; border-radius: 8px; }
</style>
