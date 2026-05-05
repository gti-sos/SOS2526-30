<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    let yearsList = [];
    
    // Función para inicializar datos en la API externa
    async function loadInitialData() {
        console.log('🔄 Inicializando datos en Active Satellites API...');
        
        try {
            const response = await fetch('https://sos2526-14-yjus.onrender.com/api/v1/active-satellites/LoadInitialData');
            const data = await response.json();
            console.log('✅ Respuesta de LoadInitialData:', data);
            return data;
        } catch (err) {
            console.warn('⚠️ Error en LoadInitialData (puede que ya esté inicializado):', err.message);
            return null;
        }
    }
    
    // Función para obtener datos de satélites después de inicializar
    async function fetchSatellitesData() {
        console.log('🛰️ Obteniendo datos de satélites...');
        
        const response = await fetch('https://sos2526-14-yjus.onrender.com/api/v1/active-satellites?limit=200');
        const data = await response.json();
        console.log(`✅ Active Satellites: ${data.length} registros`);
        
        return data;
    }
    
    // Función para cargar datos de Cheaters Stats
    async function fetchCheatersData() {
        console.log('📊 Cargando datos de Cheaters Stats...');
        
        const response = await fetch('/api/v2/cheaters-stats?limit=200');
        const json = await response.json();
        const data = json.data || [];
        console.log(`✅ Cheaters: ${data.length} registros`);
        
        return data;
    }
    
    // Función para procesar datos de Satélites
    function processSatellitesData(satellitesData) {
        const satellitesByYear = {};
        
        satellitesData.forEach(item => {
            let year = item.launch_year || item.year || item.launchYear || item.date_launch || item.launch_date;
            
            if (year && typeof year === 'string' && year.includes('-')) {
                year = year.split('-')[0];
            }
            
            if (year && !isNaN(parseInt(year))) {
                year = parseInt(year).toString();
                satellitesByYear[year] = (satellitesByYear[year] || 0) + 1;
            }
        });
        
        console.log('🛰️ Satélites por año:', satellitesByYear);
        return satellitesByYear;
    }
    
    // Función para procesar datos de Cheaters
    function processCheatersData(cheatersData) {
        const cheatersByYear = {};
        cheatersData.forEach(item => {
            const year = item.year;
            if (year) {
                cheatersByYear[year] = (cheatersByYear[year] || 0) + (item.cheater_report || 0);
            }
        });
        console.log('📊 Cheaters por año:', cheatersByYear);
        return cheatersByYear;
    }
    
    // Función para preparar datos del gráfico
    function prepareChartData(cheatersByYear, satellitesByYear) {
        const allYearsSet = new Set([...Object.keys(cheatersByYear), ...Object.keys(satellitesByYear)]);
        const allYears = Array.from(allYearsSet).sort((a, b) => a - b);
        
        const years = allYears.map(y => y.toString());
        const reportsData = allYears.map(y => cheatersByYear[y] || 0);
        const satellitesDataMapped = allYears.map(y => satellitesByYear[y] || 0);
        
        const maxReports = Math.max(...reportsData);
        const maxSatellites = Math.max(...satellitesDataMapped);
        
        const normalizedReports = reportsData.map(r => maxReports > 0 ? (r / maxReports) * 100 : 0);
        const normalizedSatellites = satellitesDataMapped.map(s => maxSatellites > 0 ? (s / maxSatellites) * 100 : 0);
        
        return {
            years,
            reportsData,
            satellitesData: satellitesDataMapped,
            normalizedReports,
            normalizedSatellites,
            maxSatellites
        };
    }
    
    // Función para renderizar el gráfico
    function renderChart(chartData) {
        const canvas = document.getElementById('chart');
        if (!canvas) throw new Error('Canvas no encontrado');
        
        const ctx = canvas.getContext('2d');
        if (chart) chart.destroy();
        
        chart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: chartData.years,
                datasets: [
                    {
                        label: '📊 Reportes de Tramposos (Cheaters)',
                        data: chartData.normalizedReports,
                        backgroundColor: 'rgba(124,58,237,0.2)',
                        borderColor: '#7e22ce',
                        borderWidth: 3,
                        pointBackgroundColor: (ctx) => {
                            const value = chartData.normalizedReports[ctx.dataIndex];
                            return value > 0 ? '#7e22ce' : '#c084fc';
                        },
                        pointBorderColor: 'white',
                        pointRadius: (ctx) => {
                            const value = chartData.normalizedReports[ctx.dataIndex];
                            return value > 0 ? 6 : 3;
                        },
                        pointHoverRadius: 8,
                        fill: true
                    },
                    {
                        label: '🛰️ Satélites Activos Lanzados',
                        data: chartData.normalizedSatellites,
                        backgroundColor: 'rgba(59,130,246,0.2)',
                        borderColor: '#3b82f6',
                        borderWidth: 3,
                        pointBackgroundColor: (ctx) => {
                            const value = chartData.normalizedSatellites[ctx.dataIndex];
                            return value > 0 ? '#3b82f6' : '#93c5fd';
                        },
                        pointBorderColor: 'white',
                        pointRadius: (ctx) => {
                            const value = chartData.normalizedSatellites[ctx.dataIndex];
                            return value > 0 ? 6 : 3;
                        },
                        pointHoverRadius: 8,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { 
                        display: true, 
                        text: '🛰️ Reportes de Tramposos vs Satélites Activos Lanzados', 
                        color: '#1e3a8a', 
                        font: { size: 16, weight: 'bold' } 
                    },
                    subtitle: { 
                        display: true, 
                        text: chartData.maxSatellites === 0 ? '⚠️ No se encontraron datos de años en la API de satélites' : 'Gráfico de Radar - Normalizado a escala 0-100' 
                    },
                    tooltip: { 
                        callbacks: { 
                            label: (ctx) => {
                                const index = ctx.dataIndex;
                                const year = chartData.years[index];
                                const reportsReal = chartData.reportsData[index];
                                const satellitesReal = chartData.satellitesData[index];
                                
                                if (ctx.dataset.label.includes('Reportes')) {
                                    if (reportsReal > 0) {
                                        return `📊 Reportes ${year}: ${reportsReal.toLocaleString()}`;
                                    } else {
                                        return `📅 ${year}: Sin datos de reportes`;
                                    }
                                } else {
                                    if (satellitesReal > 0) {
                                        return `🛰️ Satélites ${year}: ${satellitesReal.toLocaleString()}`;
                                    } else {
                                        return `📅 ${year}: Sin datos de satélites`;
                                    }
                                }
                            }
                        }
                    },
                    legend: { 
                        position: 'bottom',
                        labels: { usePointStyle: true, boxWidth: 15, font: { size: 12 } }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { 
                            stepSize: 20,
                            backdropColor: 'transparent',
                            callback: (val) => `${val}%`
                        },
                        grid: { color: '#dbeafe' },
                        title: { display: true, text: 'Valor normalizado (%)', font: { size: 11 } }
                    }
                }
            }
        });
    }
    
    onMount(async () => {
        await tick();
        
        try {
            console.log('🚀 Iniciando proceso para Active Satellites...');
            
            // PASO 1: Llamar a LoadInitialData en la API externa
            const initResult = await loadInitialData();
            console.log('📦 Inicialización completada:', initResult);
            
            // Pequeña pausa para asegurar que los datos se inicializaron
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // PASO 2: Obtener datos de satélites (ya inicializados)
            const satellitesData = await fetchSatellitesData();
            
            // PASO 3: Obtener datos de Cheaters Stats
            const cheatersData = await fetchCheatersData();
            
            // PASO 4: Procesar datos
            const satellitesByYear = processSatellitesData(satellitesData);
            const cheatersByYear = processCheatersData(cheatersData);
            
            // PASO 5: Preparar datos para el gráfico
            const chartData = prepareChartData(cheatersByYear, satellitesByYear);
            yearsList = chartData.years;
            console.log('📅 Años a mostrar:', yearsList);
            console.log('📊 Reportes:', chartData.reportsData);
            console.log('🛰️ Satélites:', chartData.satellitesData);
            
            // PASO 6: Renderizar gráfico
            renderChart(chartData);
            
            loading = false;
            console.log('✅ Gráfico de Radar creado exitosamente');
            
        } catch (err) {
            console.error('❌ Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>🛰️ Active Satellites + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Radar: Evolución anual de reportes vs lanzamiento de satélites activos</p>
    
    <div style="height: 600px; width: 100%;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">🔄 Inicializando API de satélites... (LoadInitialData → Fetch datos → Procesamiento → Gráfico)</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>📌 Interpretación del gráfico de Radar:</strong></p>
            <ul>
                <li><strong>🟣 Línea morada:</strong> Reportes de tramposos (Cheaters Stats)</li>
                <li><strong>🔵 Línea azul:</strong> Satélites activos lanzados (Active Satellites API)</li>
                <li><strong>📅 Eje radial:</strong> Años disponibles en las APIs</li>
                <li><strong>📈 Valores normalizados:</strong> Ambos datasets escalados a 0-100%</li>
                <li><strong>🔘 Puntos pequeños:</strong> Indican datos solo en una API ese año</li>
            </ul>
            <p><strong>📐 Años representados:</strong> {yearsList.length} años ({yearsList.join(', ')})</p>
            <p><strong>🔗 API de Satélites:</strong> Jaime García Algarra - <code>https://sos2526-14-yjus.onrender.com/api/v1/active-satellites</code></p>
            <p><strong>🔄 Flujo de datos:</strong> LoadInitialData (inicializa API) → Fetch Satélites → Fetch Cheaters → Procesamiento → Renderizado</p>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #dbeafe; }
    .back-link { color: #2563eb; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #1e3a8a; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #2563eb; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #eff6ff; border-radius: 8px; font-size: 0.85rem; color: #1e40af; border-left: 4px solid #3b82f6; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #bfdbfe; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>