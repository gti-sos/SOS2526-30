<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    let yearsList = [];
    let touristByYear = {};
    
    // Función para inicializar datos en la API externa (Tourist Arrivals)
    async function loadInitialData() {
        console.log('✈️ Inicializando datos en Tourist Arrivals API...');
        
        try {
            const response = await fetch('https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals/LoadInitialData');
            
            // 400 significa que ya estaba inicializado (no es un error real)
            if (response.status === 400) {
                const data = await response.json();
                console.log('ℹ️', data.message);
                return { alreadyInitialized: true, message: data.message };
            }
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅', data.message);
                return { initialized: true, message: data.message };
            }
            
            throw new Error(`HTTP ${response.status}`);
            
        } catch (err) {
            console.warn('⚠️ No se pudo inicializar (puede que ya lo esté):', err.message);
            return null;
        }
    }
    
    // Función para obtener datos de turistas después de inicializar
    async function fetchTouristData() {
        console.log('✈️ Obteniendo datos de llegadas turísticas...');
        
        const response = await fetch('https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals?limit=200');
        const data = await response.json();
        console.log(`✅ Tourist Arrivals: ${data.length} registros`);
        
        // Mostrar estructura
        if (data.length > 0) {
            console.log('Estructura de datos:', Object.keys(data[0]));
        }
        
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
    
    // Función para procesar datos de Turistas
    function processTouristData(touristData) {
        const touristByYearTemp = {};
        
        touristData.forEach(item => {
            const year = item.year;
            if (year) {
                // Sumar todos los tipos de llegada para cada país
                const totalArrivals = (item.air_arrival || 0) + 
                                     (item.water_arrival || 0) + 
                                     (item.land_arrival || 0);
                
                if (totalArrivals > 0) {
                    touristByYearTemp[year] = (touristByYearTemp[year] || 0) + totalArrivals;
                }
            }
        });
        
        console.log('✈️ Turistas por año:', touristByYearTemp);
        return touristByYearTemp;
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
    function prepareChartData(cheatersByYear, touristByYearTemp) {
        const allYearsSet = new Set([...Object.keys(cheatersByYear), ...Object.keys(touristByYearTemp)]);
        const allYears = Array.from(allYearsSet).sort((a, b) => a - b);
        
        const years = allYears.map(y => y.toString());
        const reportsData = allYears.map(y => cheatersByYear[y] || 0);
        const touristDataMapped = allYears.map(y => touristByYearTemp[y] || 0);
        
        const maxReports = Math.max(...reportsData);
        const maxTourist = Math.max(...touristDataMapped);
        
        const normalizedReports = reportsData.map(r => maxReports > 0 ? (r / maxReports) * 100 : 0);
        const normalizedTourist = touristDataMapped.map(t => maxTourist > 0 ? (t / maxTourist) * 100 : 0);
        
        return {
            years,
            reportsData,
            touristData: touristDataMapped,
            normalizedReports,
            normalizedTourist,
            maxReports,
            maxTourist
        };
    }
    
    // Función para renderizar el gráfico de radar
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
                        label: '✈️ Llegadas Turistas Internacionales',
                        data: chartData.normalizedTourist,
                        backgroundColor: 'rgba(34,197,94,0.2)',
                        borderColor: '#22c55e',
                        borderWidth: 3,
                        pointBackgroundColor: (ctx) => {
                            const value = chartData.normalizedTourist[ctx.dataIndex];
                            return value > 0 ? '#22c55e' : '#86efac';
                        },
                        pointBorderColor: 'white',
                        pointRadius: (ctx) => {
                            const value = chartData.normalizedTourist[ctx.dataIndex];
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
                        text: '✈️ Reportes de Tramposos vs Llegadas Turísticas Internacionales', 
                        color: '#15803d', 
                        font: { size: 16, weight: 'bold' } 
                    },
                    subtitle: { 
                        display: true, 
                        text: 'Gráfico de Radar - Normalizado a escala 0-100 (suma de llegadas aéreas, marítimas y terrestres)' 
                    },
                    tooltip: { 
                        callbacks: { 
                            label: (ctx) => {
                                const index = ctx.dataIndex;
                                const year = chartData.years[index];
                                const reportsReal = chartData.reportsData[index];
                                const touristReal = chartData.touristData[index];
                                
                                if (ctx.dataset.label.includes('Reportes')) {
                                    if (reportsReal > 0) {
                                        return `📊 Reportes ${year}: ${reportsReal.toLocaleString()}`;
                                    } else {
                                        return `📅 ${year}: Sin datos de reportes de tramposos`;
                                    }
                                } else {
                                    if (touristReal > 0) {
                                        return [
                                            `✈️ Llegadas totales ${year}: ${touristReal.toLocaleString()}`,
                                            `📊 Basado en datos de múltiples países`
                                        ];
                                    } else {
                                        return `📅 ${year}: Sin datos de llegadas turísticas`;
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
                        grid: { color: '#dcfce7' },
                        title: { display: true, text: 'Valor normalizado (%)', font: { size: 11 } }
                    }
                }
            }
        });
    }
    
    onMount(async () => {
        await tick();
        
        try {
            console.log('🚀 Iniciando proceso para International Tourist Arrivals...');
            
            // PASO 1: Llamar a LoadInitialData en la API externa
            const initResult = await loadInitialData();
            console.log('📦 Inicialización completada:', initResult);
            
            // Pequeña pausa para asegurar que los datos se inicializaron
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // PASO 2: Obtener datos de turistas (ya inicializados)
            const touristData = await fetchTouristData();
            
            // PASO 3: Obtener datos de Cheaters Stats
            const cheatersData = await fetchCheatersData();
            
            // PASO 4: Procesar datos
            const touristByYearTemp = processTouristData(touristData);
            touristByYear = touristByYearTemp; // Guardar para mostrar en el HTML
            const cheatersByYear = processCheatersData(cheatersData);
            
            // PASO 5: Preparar datos para el gráfico
            const chartData = prepareChartData(cheatersByYear, touristByYearTemp);
            yearsList = chartData.years;
            console.log('📅 Años a mostrar:', yearsList);
            console.log('📊 Reportes:', chartData.reportsData);
            console.log('✈️ Turistas:', chartData.touristData);
            
            // PASO 6: Renderizar gráfico
            renderChart(chartData);
            
            loading = false;
            console.log('✅ Gráfico de Radar creado correctamente con datos de turistas');
            
        } catch (err) {
            console.error('❌ Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>✈️ International Tourist Arrivals + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Radar: Evolución anual de reportes vs llegadas de turistas internacionales</p>
    
    <div style="height: 600px; width: 100%;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">✈️ Cargando datos de las APIs... (LoadInitialData → Fetch datos → Procesamiento → Gráfico)</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>📌 Interpretación del gráfico de Radar:</strong></p>
            <ul>
                <li><strong>🟣 Línea morada:</strong> Reportes de tramposos (Cheaters Stats)</li>
                <li><strong>🟢 Línea verde:</strong> Llegadas de turistas internacionales (Tourist Arrivals API)</li>
                <li><strong>📅 Eje radial:</strong> Años disponibles en las APIs</li>
                <li><strong>📈 Valores normalizados:</strong> Ambos datasets escalados a 0-100% para compararlos</li>
                <li><strong>🔘 Puntos pequeños:</strong> Indican que solo hay datos en una de las dos APIs ese año</li>
                <li><strong>🌍 Datos:</strong> Suma de llegadas aéreas, marítimas y terrestres de todos los países</li>
            </ul>
            <p><strong>📐 Años representados:</strong> {yearsList.length} años ({yearsList.join(', ')})</p>
            <p><strong>🔗 API de Turistas:</strong> Aimar García Borrego - <code>https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals</code></p>
            <p><strong>🔄 Flujo de datos:</strong> LoadInitialData (inicializa API Turistas) → Fetch Turistas → Fetch Cheaters → Procesamiento → Renderizado</p>
            <p><strong>📊 Total llegadas por año:</strong></p>
            <ul>
                {#each Object.entries(touristByYear) as [year, total]}
                    <li><strong>{year}:</strong> {total.toLocaleString()} llegadas</li>
                {/each}
            </ul>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #dcfce7; }
    .back-link { color: #16a34a; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #15803d; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #16a34a; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #f0fdf4; border-radius: 8px; font-size: 0.85rem; color: #166534; border-left: 4px solid #22c55e; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #bbf7d0; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>