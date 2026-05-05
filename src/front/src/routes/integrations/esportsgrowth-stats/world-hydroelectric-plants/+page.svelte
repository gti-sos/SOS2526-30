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
            
            try {
                const loadRes = await fetch('https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants/loadInitialData');
            } catch (e) {
                console.log('loadInitialData error (ignorar):', e.message);
            }
            
            // 1. Obtener tus datos: eSports Growth
            const esportsRes = await fetch('/api/v1/esportsgrowth-stats?limit=1000');
            const esportsData = await esportsRes.json();
            
            const playersByYear = {};
            // @ts-ignore
            esportsData.forEach(stat => {
                const year = stat.year;
                if (year) {
                    // @ts-ignore
                    playersByYear[year] = (playersByYear[year] || 0) + (stat.active_player_no || 0);
                }
            });
            
            // 2. Obtener datos del compañero: Hydroelectric Plants
            const hydroRes = await fetch('https://sos2526-27.onrender.com/api/v1/world-hydroelectric-plants');
            const hydroData = await hydroRes.json();
            
            const hydroByYear = {};
            // @ts-ignore
            hydroData.forEach(item => {
                const year = item.year;
                if (year) {
                    // @ts-ignore
                    if (!hydroByYear[year]) hydroByYear[year] = { capacity: 0, generation: 0, plants: 0 };
                    // @ts-ignore
                    hydroByYear[year].capacity += (item.capacity_mw || 0);
                    // @ts-ignore
                    hydroByYear[year].generation += (item.generation_gwh || 0);
                    // @ts-ignore
                    hydroByYear[year].plants += (item.number_of_plants || 0);
                }
            });
            
            // 3. UNIÓN COMPLETA: Coger todos los años de ambas APIs
            let uniqueYears = Array.from(new Set([...Object.keys(playersByYear), ...Object.keys(hydroByYear)]))
                .map(Number)
                .sort((a, b) => a - b); // Ordenar de menor a mayor

            if (uniqueYears.length > 0) {
                let maxYear = uniqueYears[uniqueYears.length - 1];
                let minYear = uniqueYears[0];
                
                // 4. GARANTIZAR AL MENOS 10 AÑOS EN LA GRÁFICA
                if (maxYear - minYear < 9) {
                    minYear = maxYear - 9; // Forzamos a que empiece 9 años antes del máximo
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
                    capacity: hydroByYear[year] ? hydroByYear[year].capacity : 0
                }));
            } else {
                combinedData = [];
            }
            
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
    
    function initChart() {
        if (combinedData.length === 0 || chartInitialized) return;
        
        const container = document.querySelector('#chart-container');
        if (!container) return;
        
        const categories = combinedData.map(d => d.year);
        const playersData = combinedData.map(d => d.players);
        const capacityData = combinedData.map(d => d.capacity);
        
        const options = {
            series: [{
                name: 'Total Jugadores eSports (M)',
                data: playersData
            }, {
                name: 'Capacidad Hidro. Mundial (MW)',
                data: capacityData
            }],
            chart: {
                height: 500,
                type: 'area', 
                toolbar: { show: false }
            },
            colors: ['#7e22ce', '#3b82f6'],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            fill: {
                type: 'gradient',
                gradient: { shadeIntensity: 1, opacityFrom: 0.7, opacityTo: 0.2, stops: [0, 90, 100] }
            },
            xaxis: {
                categories: categories,
                title: { text: 'Año' }
            },
            yaxis: [
                {
                    title: { text: 'Jugadores Activos (Millones)' },
                    labels: { style: { colors: '#7e22ce' } }
                },
                {
                    opposite: true,
                    title: { text: 'Capacidad Total (MW)' },
                    labels: { style: { colors: '#3b82f6' } }
                }
            ],
            tooltip: { shared: true, intersect: false }
        };
        
        // @ts-ignore
        const chart = new window.ApexCharts(container, options);
        chart.render();
        
        chartInitialized = true;
    }
</script>

<svelte:head>
    <title>API Grupo 27 - Integraciones</title>
    <!-- Importamos ApexCharts por CDN -->
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</svelte:head>

<div class="integration-container">
    <h1>🎮 eSports vs ⚡ Energía Hidroeléctrica</h1>
    <p class="subtitle">Evolución global a 10 años: Jugadores vs Capacidad instalada (Total Mundial)</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> eSports Growth Stats - Agrupado por Año</p>
        <p><strong>API 2 (compañero):</strong> World Hydroelectric Plants - Agrupado por Año</p>
        <p><strong>Fuente:</strong> Grupo 27 - SOS</p>
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
        <!-- Contenedor único de la gráfica -->
        <div id="chart-container" style="height: 550px; width: 100%; margin-bottom: 2rem; display: {combinedData.length > 0 ? 'block' : 'none'};"></div>
    {/if}
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
</style>